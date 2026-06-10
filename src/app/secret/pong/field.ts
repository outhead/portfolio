/**
 * «Магнитное» векторное поле для альтернативного режима понга.
 * ОДНА формула на всё: хост считает по ней силу на мяч (CPU, детерминированно
 * по своему времени), фон MagneticWaves рисует по ней же линии течения —
 * игрок «читает» поле глазами. Не менять формулу в одном месте без другого.
 */

// Канонические размеры поля (портрет). Низ = host (p1), верх = guest (p2).
export const FW = 420;
export const FH = 640;

// Сила поля: ускорение px/шаг² (фикс-шаг 60 Гц). Подбиралось по ощущению
// «мяч заметно виляет, но отбивается».
export const FIELD_STRENGTH = 0.09;
// Пространственная частота: ~1/250px — 2–3 «завихрения» на высоту поля.
export const FIELD_SCALE = 0.004;
// Скорость дрейфа поля (нойз-единиц на мс): полный «передув» картинки ~15–20с.
export const FIELD_TIME = 0.00006;
// Ослабление у ракеток: на плоскости ракетки сила 0, полная — в 110px от неё,
// чтобы не было «нечестных» промахов у самой палки.
export const FIELD_FADE_PX = 110;

const fr = (v: number) => v - Math.floor(v);
const hs = (x: number, y: number) => fr(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

/** value-noise 0..1, гладкий (smoothstep-интерполяция) */
export function fieldNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hs(ix, iy), b = hs(ix + 1, iy), c = hs(ix, iy + 1), d = hs(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/**
 * Угол течения поля в точке (x, y — канонические координаты поля, tMs — мс).
 * Время дрейфует поле сдвигом по y в нойз-пространстве (как в старом
 * LatentFlowBackground). 0..4π — поле успевает «закрутиться» в обе стороны.
 */
export function flowAngle(x: number, y: number, tMs: number): number {
  return fieldNoise(x * FIELD_SCALE, y * FIELD_SCALE + tMs * FIELD_TIME) * Math.PI * 4;
}
