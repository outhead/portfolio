#!/usr/bin/env python3
"""photo_to_pointcloud.py — конвертирует селфи в облако точек для ParticleSphere.

Pipeline:
  1. Load image (RGB)
  2. rembg → silhouette mask (alpha channel) — изолируем человека
  3. Depth-Anything-V2-Small → depth map (relative depth, выше = ближе)
  4. Sample N точек из mask, веса смещены к depth-edge'ам (черты лица густее,
     гладкие зоны реже) — даёт более «портретное» облако, чем равномерный sample
  5. Normalize в диапазон [-1, 1] куба, центр на bbox-mid (face at origin),
     y инвертирован (image y вниз → 3D y вверх)
  6. Save JSON: {"version":1,"count":N,"depth_scale":...,"points":[[x,y,z],...]}

Usage:
  python photo_to_pointcloud.py input.jpg
  python photo_to_pointcloud.py input.jpg -o ../../public/data/head-points.json -n 6000 --preview preview.png

Hardware:
  - CPU:        ~30-60s (Depth-Anything-V2-Small достаточно лёгкая)
  - MPS (M*):   ~5-10s
  - CUDA:       <2s
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image


# ── Stage 1: background removal ─────────────────────────────────────
def remove_background(image: Image.Image) -> np.ndarray:
    """rembg c моделью u2net_human_seg — лучшая из коробки для людей.

    Возвращает HxWx4 RGBA (альфа = силуэт).
    """
    from rembg import new_session, remove

    session = new_session("u2net_human_seg")
    out = remove(image, session=session)
    return np.array(out)


# ── Stage 2: depth estimation ───────────────────────────────────────
def compute_depth(image: Image.Image, device: str) -> np.ndarray:
    """Depth-Anything-V2-Small (~25M parameters), HuggingFace pipeline.

    Возвращает HxW float32. Чем выше значение — тем ближе к камере (relative).
    """
    from transformers import pipeline

    # device="cpu" / "mps" / "cuda" — pipeline сам подхватит
    pipe = pipeline(
        task="depth-estimation",
        model="depth-anything/Depth-Anything-V2-Small-hf",
        device=device,
    )
    out = pipe(image)
    return np.array(out["depth"], dtype=np.float32)


# ── Stage 3: point sampling ─────────────────────────────────────────
def sample_points(
    rgba: np.ndarray,
    depth: np.ndarray,
    n: int,
    rng: np.random.Generator,
    edge_bias: float = 0.6,
) -> np.ndarray:
    """Sample N точек, веса = (1 - edge_bias) + edge_bias * |∇depth|.

    edge_bias=0   — равномерное распределение по mask'у.
    edge_bias=1   — только грани depth (черты лица, контур).
    edge_bias=0.6 — компромисс: фон-формы + черты подсвечены.

    Returns (N, 3) в PIXEL coords (xs, ys, depth_value).
    """
    h, w = depth.shape

    # Привести alpha к размеру depth (Depth-Anything может ресайзить)
    if rgba.shape[:2] != (h, w):
        alpha_img = Image.fromarray(rgba[..., 3]).resize((w, h), Image.LANCZOS)
        alpha = np.array(alpha_img, dtype=np.float32) / 255.0
    else:
        alpha = rgba[..., 3].astype(np.float32) / 255.0

    mask = alpha > 0.5
    if int(mask.sum()) < n:
        raise ValueError(
            f"маска даёт {int(mask.sum())} пикселей, нужно ≥ {n}. "
            f"Попробуй фото с большим лицом или уменьши --points."
        )

    dy, dx = np.gradient(depth)
    edge = np.hypot(dx, dy)
    edge = edge / (edge.max() + 1e-9)

    weights = ((1.0 - edge_bias) + edge_bias * edge) * mask.astype(np.float32)
    flat = weights.flatten()
    flat /= flat.sum()

    idx = rng.choice(flat.size, size=n, replace=False, p=flat)
    ys, xs = np.unravel_index(idx, (h, w))
    ds = depth[ys, xs]
    return np.stack([xs.astype(np.float32), ys.astype(np.float32), ds], axis=1)


# ── Stage 4: normalize ──────────────────────────────────────────────
def normalize_points(pts_pixel: np.ndarray, depth_scale: float = 0.6) -> np.ndarray:
    """Center на bbox-mid, scale так чтобы max half-extent = 1, flip Y, scale Z."""
    xs = pts_pixel[:, 0]
    ys = pts_pixel[:, 1]
    zs = pts_pixel[:, 2]

    cx = (xs.min() + xs.max()) / 2
    cy = (ys.min() + ys.max()) / 2
    half = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
    half = max(half, 1.0)  # защита от деления на 0

    nx = (xs - cx) / half
    ny = -(ys - cy) / half  # image y вниз → 3D y вверх

    if zs.max() > zs.min():
        zn = (zs - zs.mean()) / (zs.max() - zs.min())
    else:
        zn = np.zeros_like(zs)
    nz = zn * depth_scale

    return np.stack([nx, ny, nz], axis=1).astype(np.float32)


# ── Stage 5: preview (debug) ────────────────────────────────────────
def save_preview(rgba: np.ndarray, depth: np.ndarray, pts_pixel: np.ndarray, path: Path) -> None:
    """3-panel: alpha mask | depth | sampled-points overlay (для дебага)."""
    from PIL import ImageDraw

    h, w = depth.shape

    alpha_img = Image.fromarray(rgba[..., 3])
    if alpha_img.size != (w, h):
        alpha_img = alpha_img.resize((w, h), Image.LANCZOS)
    alpha_rgb = alpha_img.convert("RGB")

    d = depth - depth.min()
    d = (d / (d.max() + 1e-9) * 255).astype(np.uint8)
    depth_rgb = Image.fromarray(d).convert("RGB")

    overlay = alpha_rgb.copy()
    draw = ImageDraw.Draw(overlay)
    for x, y, _ in pts_pixel:
        draw.ellipse((x - 1, y - 1, x + 1, y + 1), fill=(166, 255, 0))

    canvas = Image.new("RGB", (w * 3, h), (0, 0, 0))
    canvas.paste(alpha_rgb, (0, 0))
    canvas.paste(depth_rgb, (w, 0))
    canvas.paste(overlay, (w * 2, 0))
    canvas.save(path)


# ── Helpers ─────────────────────────────────────────────────────────
def detect_device() -> str:
    try:
        import torch  # noqa: WPS433

        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
    except Exception:  # noqa: BLE001
        pass
    return "cpu"


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument("input", type=Path, help="Селфи (JPG/PNG)")
    ap.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("head-points.json"),
        help="Куда писать JSON (default: ./head-points.json)",
    )
    ap.add_argument(
        "--points",
        "-n",
        type=int,
        default=6000,
        help="Сколько точек семплить (default: 6000; ParticleSphere в hero ~7000)",
    )
    ap.add_argument(
        "--edge-bias",
        type=float,
        default=0.6,
        help="0..1 — насколько точки тянутся к depth-граням. 0 = равномерно, 1 = только контуры",
    )
    ap.add_argument(
        "--depth-scale",
        type=float,
        default=0.6,
        help="Z scale относительно half-width (default: 0.6 — голова не такая глубокая, как широкая)",
    )
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument(
        "--preview",
        type=Path,
        default=None,
        help="Дебаг-картинка (3-panel: mask | depth | sampled points)",
    )
    ap.add_argument("--device", choices=["auto", "cpu", "cuda", "mps"], default="auto")
    args = ap.parse_args()

    if not args.input.exists():
        print(f"[err] входной файл не найден: {args.input}", file=sys.stderr)
        return 1

    print(f"[1/4] открываю {args.input}")
    image = Image.open(args.input).convert("RGB")
    print(f"      размер: {image.size}")

    device = args.device if args.device != "auto" else detect_device()
    print(f"      device: {device}")

    print("[2/4] background removal (rembg, u2net_human_seg)...")
    rgba = remove_background(image)
    visible = int((rgba[..., 3] > 128).sum())
    print(f"      пикселей в силуэте: {visible:,}")

    print("[3/4] depth (Depth-Anything-V2-Small)...")
    depth = compute_depth(image, device)
    print(f"      depth: {depth.shape}, range [{depth.min():.2f}, {depth.max():.2f}]")

    rng = np.random.default_rng(args.seed)
    print(f"[4/4] sample {args.points} точек, edge_bias={args.edge_bias}, depth_scale={args.depth_scale}")
    pts_pixel = sample_points(rgba, depth, args.points, rng, edge_bias=args.edge_bias)
    pts = normalize_points(pts_pixel, depth_scale=args.depth_scale)

    out = {
        "version": 1,
        "source": args.input.name,
        "count": int(pts.shape[0]),
        "depth_scale": args.depth_scale,
        "edge_bias": args.edge_bias,
        "points": pts.round(4).tolist(),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
    size_kb = args.output.stat().st_size / 1024
    print(f"      → {args.output} ({pts.shape[0]} pts, {size_kb:.0f} KB)")

    if args.preview:
        print(f"      preview → {args.preview}")
        args.preview.parent.mkdir(parents=True, exist_ok=True)
        save_preview(rgba, depth, pts_pixel, args.preview)

    return 0


if __name__ == "__main__":
    sys.exit(main())
