"use client";

import LedText from "@/components/LedText";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { useLocale } from "@/lib/useLocale";
import { pick } from "@/lib/i18n";
import { markQuestStart } from "./leaderboard";
import QuestBackground from "@/components/QuestBackground";
import HintButton from "@/components/HintButton";
import QuestButton from "@/components/QuestButton";

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 130, spread: 100, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

// Шифр Цезаря. Алфавит зависит от локали: RU — 33 буквы (ё включена),
// EN — 26 букв.
const ALPHABET_RU = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const ALPHABET_EN = "abcdefghijklmnopqrstuvwxyz";

function caesarShift(text: string, shift: number, alphabet: string): string {
  const n = alphabet.length;
  return [...text]
    .map((ch) => {
      const lower = ch.toLowerCase();
      const idx = alphabet.indexOf(lower);
      if (idx === -1) return ch;
      const shifted = alphabet[(idx + shift + n * 10) % n];
      // Сохраняем оригинальный регистр
      return ch === lower ? shifted : shifted.toUpperCase();
    })
    .join("");
}

const ORIGINAL_RU = "я очень люблю пасхалки. осо61енно когда они ведут еще куда-то";
const ORIGINAL_EN = "i really love easter eggs. espe61ally when they lead somewhere else";
const CIPHER_SHIFT = 22; // зашифровали с +22 — правильный «дешифрующий» сдвиг тоже 22

// Слайдер 0..SHIFT_MAX. До 61 ползунком НЕ доехать — его вводят вручную
// (клик по счётчику). Подсказка «61» спрятана в расшифрованной фразе: «осо61енно».
const SHIFT_MAX = 46;

// На особой позиции SECRET_SHIFT показываем бонусную фразу с буквами наоборот.
const SECRET_SHIFT = 61;
const SECRET_TEXT_RAW_RU = "21 мая, здесь будет новая пасхалка";
const SECRET_TEXT_RAW_EN = "may 21, a new easter egg will live here";

// Ссылка на продолжение квеста (часть II).
const QUEST2_HREF = "/secret/dalshe";

// Сколько мс пользователь должен «постоять» на правильной позиции, прежде чем
// мы подтвердим разгадку (зелёный текст + сообщение). Иначе при простом
// проезде через 22 заголовок мигал бы зелёным.
const SOLVE_CONFIRM_MS = 3000;

export default function SecretPage() {
  const locale = useLocale();

  // Алфавит/тексты/шифр — по текущей локали. RU и EN считаются отдельно.
  const ALPHABET = locale === "en" ? ALPHABET_EN : ALPHABET_RU;
  const ORIGINAL = locale === "en" ? ORIGINAL_EN : ORIGINAL_RU;
  const SECRET_TEXT_RAW = locale === "en" ? SECRET_TEXT_RAW_EN : SECRET_TEXT_RAW_RU;
  const ENCRYPTED = useMemo(
    () => caesarShift(ORIGINAL, CIPHER_SHIFT, ALPHABET),
    [ORIGINAL, ALPHABET],
  );
  const SECRET_TEXT_REVERSED = useMemo(
    () => [...SECRET_TEXT_RAW].reverse().join(""),
    [SECRET_TEXT_RAW],
  );

  // Слайдер двигает «дешифрующий» сдвиг от 0 до 32.
  // При сдвиге = 30 (или эквивалентно -3) текст возвращается к оригиналу.
  const [decryptShift, setDecryptShift] = useState(0);

  // На SECRET_SHIFT — отдельная пасхалка (бонусный текст с буквами наоборот),
  // на остальных позициях — обычная Цезарь-расшифровка.
  const decoded = useMemo(() => {
    if (decryptShift === SECRET_SHIFT) return SECRET_TEXT_REVERSED;
    return caesarShift(ENCRYPTED, -decryptShift, ALPHABET);
  }, [decryptShift, ENCRYPTED, ALPHABET, SECRET_TEXT_REVERSED]);

  const isAtSolution =
    decryptShift !== SECRET_SHIFT &&
    decoded.toLowerCase() === ORIGINAL.toLowerCase();
  const isSecretFound = decryptShift === SECRET_SHIFT;

  // «Подтверждённая разгадка»: только если пользователь задержался на
  // правильной позиции SOLVE_CONFIRM_MS. Так заголовок не мигает зелёным
  // при проезде через 22.
  const [isSolved, setIsSolved] = useState(false);
  useEffect(() => {
    if (!isAtSolution) {
      setIsSolved(false);
      return;
    }
    const t = setTimeout(() => setIsSolved(true), SOLVE_CONFIRM_MS);
    return () => clearTimeout(t);
  }, [isAtSolution]);

  // Старт квеста — фиксируем время входа в шифр (для финального лидерборда).
  useEffect(() => { markQuestStart(); }, []);

  // Конфети при попадании на 61 (вышел за рамки)
  useEffect(() => {
    if (isSecretFound) celebrate();
  }, [isSecretFound]);

  return (
    <main
      className="relative bg-black text-white overflow-hidden flex flex-col"
      style={{ minHeight: "100dvh" }}
    >
      <QuestBackground palette="green" opacity={0.32} />
      {/* Мягкое свечение */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(166,255,0,0.08), transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(201,166,107,0.08), transparent 70%)",
        }}
      />

      {/* Контент — по центру, как на странице крестиков */}
      <section className="relative z-[1] flex-1 flex items-start justify-center px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] 2xl:px-[max(14%,calc((100%_-_1680px)/2))] pt-[64px] md:pt-[88px] pb-12">
        <div className="w-full max-w-[860px] mx-auto flex flex-col items-center text-center">
          <p className="text-white/40 mb-4 md:mb-8">
            <span className="sr-only">{pick("Шифр Цезаря · Загадка №1", "Caesar cipher · Riddle #1", locale)}</span>
            <LedText text={pick("Шифр Цезаря · Загадка №1", "Caesar cipher · Riddle #1", locale)} className="h-[9px] w-auto" />
          </p>

          {/* Большой текст — шифр или дешифровка.
              Контейнер фиксирован по высоте (~3 строки), чтобы при движении
              ползунка layout под шифром не «прыгал» вверх-вниз. */}
          <div
            className="relative w-full"
            style={{ minHeight: isSecretFound ? undefined : "clamp(120px, 14vw, 240px)" }}
          >
            {isSecretFound ? (
              <h1 className="lime-force flex justify-center">
                <span className="sr-only">{pick("Поздравляю", "Well done", locale)}</span>
                <LedText text={pick("Поздравляю", "Well done", locale)} scale={2} dot={1.45} className="h-[26px] md:h-[44px] w-auto" />
              </h1>
            ) : (
              <h1 className={isSolved ? "lime-force" : "text-white"}>
                <span className="sr-only">{decoded}</span>
                <span className="flex flex-wrap justify-center gap-x-[12px] md:gap-x-[20px] gap-y-[10px] md:gap-y-[14px]">
                  {decoded.split(" ").map((w, wi) => {
                    const lcls = "h-[18px] md:h-[30px] w-auto";
                    if (isSolved && w.includes("61")) {
                      const [pre, post] = w.split("61");
                      return (
                        <span key={wi} className="inline-flex">
                          {pre ? <LedText text={pre} scale={2} dot={1.45} className={lcls} /> : null}
                          <span className="led61">
                            <LedText text="61" scale={2} dot={1.45} className={lcls} />
                          </span>
                          {post ? <LedText text={post} scale={2} dot={1.45} className={lcls} /> : null}
                        </span>
                      );
                    }
                    return <LedText key={`${w}-${wi}`} text={w} scale={2} dot={1.45} className={lcls} />;
                  })}
                </span>
              </h1>
            )}
          </div>

          {/* Слайдер */}
          {!isSecretFound && (
          <div className="mt-10 md:mt-14 w-full max-w-2xl mx-auto">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-white/40">
                <span className="sr-only">{pick("Сдвиг", "Shift", locale)}</span>
                <LedText text={pick("Сдвиг", "Shift", locale)} className="h-[9px] w-auto" />
              </span>
              {/* Счётчик редактируемый: можно ввести число вручную (в т.ч. больше 46) */}
              {/* Значение рисуем LED-шрифтом; сам input прозрачный сверху —
                  редактирование живое, каретка лаймовая, цифры пиксельные. */}
              <span className="relative inline-flex items-center justify-end min-w-[3em] h-[24px]">
                <span className="text-white pointer-events-none">
                  <LedText text={String(decryptShift)} scale={2} dot={1.45} className="h-[15px] md:h-[18px] w-auto" />
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={decryptShift}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setDecryptShift(Math.max(0, Math.min(99, Number(v || 0))));
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label={pick("Ввести сдвиг вручную", "Enter shift manually", locale)}
                  className="absolute inset-0 w-full bg-transparent text-right font-mono text-[clamp(16px,1.6vw,22px)] tabular-nums text-transparent caret-[#A6FF00] selection:bg-[#A6FF00]/30 outline-none cursor-text"
                />
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={SHIFT_MAX}
              step={1}
              value={decryptShift}
              onChange={(e) => setDecryptShift(Number(e.target.value))}
              aria-label={pick("Сдвиг шифра", "Cipher shift", locale)}
              className="w-full h-2 appearance-none bg-white/[0.08] rounded-full outline-none cursor-pointer slider-lime"
            />

            <div className="flex items-center justify-between mt-3 text-white/30">
              <LedText text="0" className="h-[9px] w-auto" />
              <LedText text={String(SHIFT_MAX)} className="h-[9px] w-auto" />
            </div>

            {/* Подсказка — по кнопке */}
            <HintButton
              className="mt-8 md:mt-10"
              disabled={isSolved || isSecretFound}
              hints={pick(
                [
                  "Настоящий сдвиг — двузначное число.",
                  "Ползунка не хватает. Кликни по самому числу и впиши его вручную.",
                ],
                [
                  "The real shift is a two-digit number.",
                  "The slider isn't enough. Click the number itself and type it in by hand.",
                ],
                locale,
              )}
            />

            {/* Сообщение после разгадки */}
            {isSolved ? (
              <div className="mt-8 md:mt-10 flex flex-col items-center text-center">
                <p className="text-sm md:text-[16px] text-white/65 max-w-lg">
                  {pick(
                    "Это ещё не конец, скорее самое начало. Ну разве что ты не решишь сдаться.",
                    "This isn't the end — more like the very beginning. Unless you decide to give up.",
                    locale,
                  )}
                </p>
                <p className="mt-3 text-[14px] md:text-sm text-[#C9A66B]/90 max-w-lg">
                  {pick(
                    "Видишь число в строке? Впиши его в счётчик сдвига.",
                    "See the number in the phrase? Type it into the shift counter.",
                    locale,
                  )}
                </p>
                <QuestButton href="/" variant="tertiary" className="mt-6">
                  {pick("← Вернуться", "← Back", locale)}
                </QuestButton>
              </div>
            ) : null}

          </div>
          )}

          {/* Празднование на 61 — вышел за рамки */}
          {isSecretFound && (
            <div className="mt-10 md:mt-12 flex flex-col items-center text-center">
              <p className="text-base md:text-lg text-white/70 max-w-lg leading-relaxed">
                {pick(
                  "Ты вышел за рамки. Но сможешь ли повторить свой успех?",
                  "You went outside the box. But can you pull it off again?",
                  locale,
                )}
              </p>
              <QuestButton href={QUEST2_HREF} ymGoal="quest2_open" arrow className="mt-7">
                {pick("Дальше", "Next", locale)}
              </QuestButton>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .slider-lime::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #a6ff00;
          border: 2px solid #000;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(166, 255, 0, 0.4);
        }
        .slider-lime::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #a6ff00;
          border: 2px solid #000;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(166, 255, 0, 0.4);
        }
      `}</style>
    </main>
  );
}
