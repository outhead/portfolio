"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import { markQuestStart } from "./leaderboard";

function celebrate() {
  const colors = ["#A6FF00", "#D9FF66", "#ECFFB3", "#FFFFFF"];
  confetti({ particleCount: 130, spread: 100, startVelocity: 45, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.25, y: 0.5 }, colors, disableForReducedMotion: true }), 200);
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.75, y: 0.5 }, colors, disableForReducedMotion: true }), 360);
}

// Шифр Цезаря на русском (33 буквы, ё включена).
const ALPHABET = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const N = ALPHABET.length;

function caesarShift(text: string, shift: number): string {
  return [...text]
    .map((ch) => {
      const lower = ch.toLowerCase();
      const idx = ALPHABET.indexOf(lower);
      if (idx === -1) return ch;
      const shifted = ALPHABET[(idx + shift + N * 10) % N];
      // Сохраняем оригинальный регистр
      return ch === lower ? shifted : shifted.toUpperCase();
    })
    .join("");
}

const ORIGINAL = "я очень люблю пасхалки. осо61енно когда они ведут еще куда-то";
const CIPHER_SHIFT = 22; // зашифровали с +22 — правильный «дешифрующий» сдвиг тоже 22
const ENCRYPTED = caesarShift(ORIGINAL, CIPHER_SHIFT);

// Слайдер 0..SHIFT_MAX. До 61 ползунком НЕ доехать — его вводят вручную
// (клик по счётчику). Подсказка «61» спрятана в расшифрованной фразе: «осо61енно».
const SHIFT_MAX = 46;

// На особой позиции SECRET_SHIFT показываем бонусную фразу с буквами наоборот.
const SECRET_SHIFT = 61;
const SECRET_TEXT_RAW = "21 мая, здесь будет новая пасхалка";
const SECRET_TEXT_REVERSED = [...SECRET_TEXT_RAW].reverse().join("");

// Ссылка на продолжение квеста (часть II).
const QUEST2_HREF = "/secret/dalshe";

// Сколько мс пользователь должен «постоять» на правильной позиции, прежде чем
// мы подтвердим разгадку (зелёный текст + сообщение). Иначе при простом
// проезде через 22 заголовок мигал бы зелёным.
const SOLVE_CONFIRM_MS = 3000;

export default function SecretPage() {
  // Слайдер двигает «дешифрующий» сдвиг от 0 до 32.
  // При сдвиге = 30 (или эквивалентно -3) текст возвращается к оригиналу.
  const [decryptShift, setDecryptShift] = useState(0);

  // На SECRET_SHIFT — отдельная пасхалка (бонусный текст с буквами наоборот),
  // на остальных позициях — обычная Цезарь-расшифровка.
  const decoded = useMemo(() => {
    if (decryptShift === SECRET_SHIFT) return SECRET_TEXT_REVERSED;
    return caesarShift(ENCRYPTED, -decryptShift);
  }, [decryptShift]);

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

  // Подсказка появляется через 8 секунд, если пользователь не двигал слайдер
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main
      className="relative bg-black text-white overflow-hidden flex flex-col"
      style={{ minHeight: "100dvh" }}
    >
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
      <section className="relative z-[1] flex-1 flex items-start justify-center px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-[88px] pb-12">
        <div className="w-full max-w-[860px] mx-auto flex flex-col items-center text-center">
          <p className="font-p95 text-[12px] md:text-[13px] tracking-[0.25em] uppercase text-white/40 mb-6 md:mb-8">
            Шифр Цезаря · Загадка №1
          </p>

          {/* Большой текст — шифр или дешифровка.
              Контейнер фиксирован по высоте (~3 строки), чтобы при движении
              ползунка layout под шифром не «прыгал» вверх-вниз. */}
          <div
            className="relative w-full"
            style={{ minHeight: isSecretFound ? undefined : "clamp(120px, 14vw, 240px)" }}
          >
            {isSecretFound ? (
              <h1
                className="font-p95 leading-[1.05] uppercase tracking-tight lime-force break-words"
                style={{ fontSize: "clamp(36px, 6vw, 88px)" }}
              >
                Поздравляю
              </h1>
            ) : (
              <h1
                className="font-p95 leading-[1.05] uppercase tracking-tight break-words text-white"
                style={{ fontSize: "clamp(28px, 5.2vw, 76px)" }}
              >
                {isSolved ? (
                  <span className="lime-force">
                    {decoded.includes("61")
                      ? (() => {
                          const [pre, post] = decoded.split("61");
                          return (
                            <>
                              {pre}
                              <span className="underline decoration-[0.08em] underline-offset-[0.12em]">61</span>
                              {post}
                            </>
                          );
                        })()
                      : decoded}
                  </span>
                ) : (
                  decoded
                )}
              </h1>
            )}
          </div>

          {/* Слайдер */}
          {!isSecretFound && (
          <div className="mt-10 md:mt-14 w-full max-w-2xl mx-auto">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-p95 text-[12px] md:text-[13px] tracking-[0.25em] uppercase text-white/40">
                Сдвиг
              </span>
              {/* Счётчик редактируемый: можно ввести число вручную (в т.ч. больше 46) */}
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
                aria-label="Ввести сдвиг вручную"
                className="w-[2.5em] bg-transparent text-right font-p95 text-[clamp(18px,2vw,28px)] tabular-nums text-white outline-none cursor-text"
              />
            </div>

            <input
              type="range"
              min={0}
              max={SHIFT_MAX}
              step={1}
              value={decryptShift}
              onChange={(e) => setDecryptShift(Number(e.target.value))}
              aria-label="Сдвиг шифра"
              className="w-full h-2 appearance-none bg-white/[0.08] rounded-full outline-none cursor-pointer slider-lime"
            />

            <div className="flex items-center justify-between mt-3 text-[12px] md:text-[13px] tracking-[0.18em] uppercase text-white/30 font-p95 tabular-nums">
              <span>0</span>
              <span>{SHIFT_MAX}</span>
            </div>

            {/* Подсказка после 8 сек */}
            <p
              className={`mt-8 md:mt-10 text-sm md:text-[15px] text-white/55 max-w-md mx-auto text-center transition-opacity duration-700 ${
                showHint && !isSolved && !isSecretFound ? "opacity-100" : "opacity-0"
              }`}
            >
              Подсказка: настоящий сдвиг — двузначное число.
            </p>

            {/* Сообщение после разгадки */}
            {isSolved ? (
              <div className="mt-8 md:mt-10 flex flex-col items-center text-center">
                <p className="text-sm md:text-[15px] text-white/65 max-w-lg">
                  Это ещё не конец, скорее самое начало. Ну разве что ты не решишь сдаться.
                </p>
                <p className="mt-3 text-[13px] md:text-sm text-[#C9A66B]/90 max-w-lg">
                  Видишь число в строке? Впиши его в счётчик сдвига.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[15px] md:text-[16px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
                  <span className="leading-none translate-y-[1px]">Вернуться</span>
                </Link>
              </div>
            ) : null}

          </div>
          )}

          {/* Празднование на 61 — вышел за рамки */}
          {isSecretFound && (
            <div className="mt-10 md:mt-12 flex flex-col items-center text-center">
              <p className="text-base md:text-lg text-white/70 max-w-lg leading-relaxed">
                Ты вышел за рамки. Но сможешь ли повторить свой успех?
              </p>
              <Link
                href={QUEST2_HREF}
                data-ym-goal="quest2_open"
                className="mt-7 inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[15px] md:text-[16px] tracking-[0.12em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline"
              >
                <span className="leading-none translate-y-[1px]">Дальше</span>
                <span className="leading-none">→</span>
              </Link>
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
