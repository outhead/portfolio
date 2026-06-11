# photo → pointcloud

Конвертирует селфи в JSON-облако точек, которое потом подхватит `ParticleSphere`
в hero-секции (новый shape `"head"`).

Pipeline: `image → rembg silhouette → Depth-Anything-V2 depth → weighted sampling → normalized JSON`.

---

## Что нужно для хорошего результата

- **Фронтальное фото** (лицо смотрит в камеру или с лёгким отклонением).
- **Контрастный фон** (rembg справится с любым, но чем чище — тем лучше).
- **Лицо занимает заметную часть кадра** — иначе мало пикселей в маске.
- **Размер** 1024–2048 px по большей стороне; больше — медленнее, толку нет.
- JPEG / PNG — оба ок.

Можно начать с любого селфи из `~/cloud project/portfolio/фото/` — посмотрим на превью, потом снимешь специально под это.

---

## Установка

### Вариант A: локально на Mac (рекомендую, M-чип = ~10 секунд на прогон)

```bash
cd "/Users/egor/cloud project/portfolio/portfolio-next/scripts/photo-to-pointcloud"

# Создаём изолированную venv, чтобы не ломать системный python
python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

Первый запуск дополнительно скачает модели:
- `u2net_human_seg.onnx` (~170 MB) — кладётся в `~/.u2net/`
- Depth-Anything-V2-Small (~98 MB) — в `~/.cache/huggingface/`

Потом всё работает офлайн.

### Вариант B: Google Colab (если не хочешь ставить Python)

1. Открой [colab.research.google.com](https://colab.research.google.com), новый notebook.
2. Загрузи файлы `photo_to_pointcloud.py` и `requirements.txt` (левая панель → upload).
3. Загрузи селфи (`selfie.jpg`).
4. В первой ячейке:
   ```python
   !pip install -q -r requirements.txt
   !python photo_to_pointcloud.py selfie.jpg -o head-points.json --preview preview.png
   ```
5. Скачай `head-points.json` и `preview.png`.

---

## Запуск

```bash
# минимально
python photo_to_pointcloud.py selfie.jpg

# рекомендую — сразу с превью и в каталог public, чтобы Next.js видел файл
python photo_to_pointcloud.py selfie.jpg \
  --output ../../public/data/head-points.json \
  --preview preview.png \
  --points 6000
```

### Параметры

| Флаг            | Default | Что делает                                                                  |
|-----------------|--------:|-----------------------------------------------------------------------------|
| `--points -n`   |    6000 | Сколько точек семплить. Больше — детальнее, но JSON жирнее.                 |
| `--edge-bias`   |     0.6 | 0 = равномерно по силуэту; 1 = только грани depth (контуры, черты лица).    |
| `--depth-scale` |     0.6 | Z-scale относительно half-width. Голова не такая глубокая, как широкая.     |
| `--preview`     |       — | 3-panel картинка: alpha mask · depth · sampled points. Для дебага.          |
| `--device`      |  `auto` | `cpu` / `mps` (M-чип) / `cuda`. Auto подхватит лучший доступный.            |

---

## Как читать превью

Превью разбит на три панели — слева направо:

1. **Mask** — что выделил rembg. Должен быть чёткий силуэт, без дыр в волосах.
   Если плохо — попробуй фото с другим фоном.
2. **Depth** — карта глубины. Лицо должно быть светлее (ближе), фон тёмный.
   Если сцена «плоская» (все одинакового цвета) — Depth-Anything может ошибаться,
   попробуй фото с большим z-разнообразием.
3. **Sampled points (зелёные)** — куда легли точки. Должны густо лечь на чертах
   (глаза, нос, край лица), реже — на лбу/щеках. Если точки только на контуре —
   уменьши `--edge-bias`.

---

## Что дальше

1. Прогоняешь скрипт, получаешь `head-points.json` + `preview.png`.
2. Кидаешь мне обе картинки на ревью — вместе оценим.
3. Я добавлю shape `"head"` в `ParticleSphere`, подключу к `HeroSlider`,
   подкручу `pitchLimit`/`cursorYawMax` под фронтальный портрет.
4. Гоняем на dev, тюним плотность точек / depth-scale, пушим в прод.
