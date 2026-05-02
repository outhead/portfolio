"use client";

/* ─────────────────────────────────────────────────────────────────
 * TypographyFix
 * Клиентский post-processor: ходит по text-нодам в document.body,
 * заменяет обычный пробел после коротких русских предлогов/союзов
 * на неразрывный ( ). Цель — убрать «висячие» предлоги в конце
 * строк ("в", "и", "на", "для", "что" и т.п.).
 *
 * Запускается один раз после монтирования + MutationObserver ловит
 * новые узлы, добавляемые при ре-рендерах (карточки, motion и пр.).
 *
 * Используется только на тех страницах, где смонтирован <TypographyFix/>.
 * Сейчас — главная (/).
 * ──────────────────────────────────────────────────────────────── */

import { useEffect } from "react";

// Короткие слова после которых пробел становится неразрывным.
// Однобуквенные: а и в к о с у я
// Двух/трёхбуквенные предлоги/союзы/частицы.
const SHORT_WORDS = [
  // 1 letter
  "а", "и", "в", "к", "о", "с", "у", "я",
  // 2 letters
  "на", "до", "по", "из", "от", "ко", "во", "со", "не", "же", "бы", "ли", "ни", "но", "то",
  // 3 letters
  "для", "при", "без", "над", "под", "про", "или", "как", "что", "это", "так", "там", "тут", "ещё", "уже",
];

const PATTERN = new RegExp(
  // (граница: начало, или НЕ-буквенно-цифровой символ)(слово)( один или более пробелов )
  `(^|[^\\p{L}\\p{N}])(${SHORT_WORDS.join("|")})[ \\t]+`,
  "giu"
);

const SKIP_TAGS = new Set([
  "code", "pre", "script", "style", "textarea", "input", "noscript", "kbd", "samp",
]);

function fixTextNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return false;
  if (SKIP_TAGS.has(parent.tagName.toLowerCase())) return false;
  const txt = node.nodeValue;
  if (!txt || txt.length < 2) return false;
  const newTxt = txt.replace(PATTERN, "$1$2 ");
  if (newTxt === txt) return false;
  node.nodeValue = newTxt;
  return true;
}

function fixSubtree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    fixTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (SKIP_TAGS.has(el.tagName.toLowerCase())) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    fixTextNode(n as Text);
  }
}

export function TypographyFix() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Initial pass — обходит всё, что отрендерилось к этому моменту.
    fixSubtree(document.body);

    // Observer — ловит новые ноды и изменения текста.
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          m.addedNodes.forEach(fixSubtree);
        } else if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          fixTextNode(m.target as Text);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
