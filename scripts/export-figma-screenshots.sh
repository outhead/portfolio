#!/bin/bash
# =============================================================
# Скрипт для экспорта скриншотов из Figma
#
# Использование:
#   1. Получи Personal Access Token: https://www.figma.com/developers/api#access-tokens
#   2. Запусти: FIGMA_TOKEN=figd_xxx ./scripts/export-figma-screenshots.sh
# =============================================================

set -euo pipefail

FIGMA_TOKEN="${FIGMA_TOKEN:?Установи FIGMA_TOKEN (Personal Access Token от Figma)}"
FILE_KEY="XDB21eWmQ0Sf51kwD6w5VG"
SCALE=2
FORMAT="png"

# Директории для скриншотов
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMG_DIR="${PROJECT_ROOT}/public/images"

mkdir -p "${IMG_DIR}/mts-2024"
mkdir -p "${IMG_DIR}/mts-b2c"
mkdir -p "${IMG_DIR}/gazprom-neft"
mkdir -p "${IMG_DIR}/ozon"

# Маппинг: nodeId → путь к файлу
# Фреймы из Figma-файла портфолио
declare -A FRAMES=(
  # МТС 2024 — Art Director B2C + AI
  ["32:5470"]="${IMG_DIR}/mts-2024/art-director-b2c.png"
  ["1:50946"]="${IMG_DIR}/mts-2024/mts-market.png"
  ["1:51084"]="${IMG_DIR}/mts-2024/mts-app-screens.png"

  # МТС B2C 2018-2021
  # (добавь nodeIds фреймов с Cashback, Premium, Строки и т.д.)

  # Газпром Нефть
  # (добавь nodeIds фреймов ЕСО, Consta)

  # OZON
  # (добавь nodeIds фреймов HR brand, design process)
)

echo "📦 Экспортирую ${#FRAMES[@]} фреймов из Figma..."
echo ""

# Собираем все nodeIds в одну строку через запятую
IDS=""
for node_id in "${!FRAMES[@]}"; do
  if [ -n "$IDS" ]; then
    IDS="${IDS},"
  fi
  IDS="${IDS}${node_id}"
done

echo "🔗 Запрашиваю URL экспорта для nodeIds: ${IDS}"

# Один запрос к Figma Images API — получаем все URL разом
RESPONSE=$(curl -s -H "X-Figma-Token: ${FIGMA_TOKEN}" \
  "https://api.figma.com/v1/images/${FILE_KEY}?ids=${IDS}&scale=${SCALE}&format=${FORMAT}")

echo "📥 Ответ получен, скачиваю изображения..."
echo ""

# Парсим URL из JSON и скачиваем
for node_id in "${!FRAMES[@]}"; do
  output_path="${FRAMES[$node_id]}"

  # Извлекаем URL для этого nodeId из JSON
  # nodeId в ответе приходит с двоеточием заменённым на двоеточие (как есть)
  url=$(echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
images = data.get('images', {})
print(images.get('${node_id}', ''))
")

  if [ -z "$url" ] || [ "$url" = "None" ]; then
    echo "⚠️  Не удалось получить URL для ${node_id}, пропускаю"
    continue
  fi

  echo "  ⬇️  ${node_id} → $(basename "$output_path")"
  curl -s -o "$output_path" "$url"

  if [ -f "$output_path" ]; then
    size=$(du -h "$output_path" | cut -f1)
    echo "  ✅ Сохранено: ${output_path} (${size})"
  else
    echo "  ❌ Ошибка при сохранении ${output_path}"
  fi
done

echo ""
echo "🎉 Готово! Скриншоты сохранены в ${IMG_DIR}"
echo ""
echo "Теперь обнови screenshots в src/data/projects.ts:"
echo ""
for node_id in "${!FRAMES[@]}"; do
  rel_path="${FRAMES[$node_id]#${PROJECT_ROOT}/public}"
  echo "  \"${rel_path}\","
done
