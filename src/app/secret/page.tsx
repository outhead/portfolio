"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

// Слайдер 0..SHIFT_MAX. Цифры в ORIGINAL (61) проходят через caesarShift как есть.
const SHIFT_MAX = 70;

// На особой позиции SECRET_SHIFT показываем бонусную фразу с буквами наоборот.
const SECRET_SHIFT = 61;
const SECRET_TEXT_RAW = "21 мая, здесь будет новая пасхалка";
const SECRET_TEXT_REVERSED = [...SECRET_TEXT_RAW].reverse().join("");

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

  // Подсказка появляется через 8 секунд, если пользователь не двигал слайдер
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Мягкое свечение */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(166,255,0,0.08), transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(201,166,107,0.08), transparent 70%)",
        }}
      />

      {/* Шапка */}
      <header className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-8 md:pt-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-white/45 hover:text-white transition-colors no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          На главную
        </Link>
        <span className="font-p95 text-[10px] md:text-[11px] tracking-[0.25em] uppercase text-[#A6FF00]">
          [ Загадка ]
        </span>
      </header>

      {/* Контент */}
      <section className="relative z-[1] px-5 md:px-[6%] lg:px-[10%] xl:px-[14%] pt-14 md:pt-24 pb-20">
        <div className="max-w-[1100px]">
          <p className="font-p95 text-[11px] md:text-[12px] tracking-[0.25em] uppercase text-white/40 mb-6 md:mb-8">
            Шифр Цезаря · сдвиньте, чтобы прочитать
          </p>

          {/* Большой текст — шифр или дешифровка.
              Контейнер фиксирован по высоте (~3 строки), чтобы при движении
              ползунка layout под шифром не «прыгал» вверх-вниз. */}
          <div
            className="relative"
            style={{ minHeight: "clamp(120px, 14vw, 240px)" }}
          >
            <h1
              className={`font-p95 leading-[1.05] uppercase tracking-tight transition-colors duration-300 break-words ${
                isSolved
                  ? "text-[#A6FF00]"
                  : isSecretFound
                  ? "text-[#C9A66B]"
                  : "text-white"
              }`}
              style={{ fontSize: "clamp(28px, 5.2vw, 76px)" }}
            >
              {decoded}
            </h1>
          </div>

          {/* Слайдер */}
          <div className="mt-12 md:mt-16 max-w-2xl">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-p95 text-[10px] md:text-[11px] tracking-[0.25em] uppercase text-white/40">
                Сдвиг
              </span>
              <span className="font-p95 text-[clamp(18px,2vw,28px)] tabular-nums text-white">
                {decryptShift}
              </span>
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

            <div className="flex items-center justify-between mt-3 text-[10px] md:text-[11px] tracking-[0.18em] uppercase text-white/30 font-p95 tabular-nums">
              <span>0</span>
              <span>{SHIFT_MAX}</span>
            </div>

            {/* Подсказка после 8 сек */}
            <p
              className={`mt-8 md:mt-10 text-sm md:text-[15px] text-white/55 max-w-md transition-opacity duration-700 ${
                showHint && !isSolved && !isSecretFound ? "opacity-100" : "opacity-0"
              }`}
            >
              Подсказка: настоящий сдвиг — двузначное число. Но если поедете дальше, может, что-то найдёте.
            </p>

            {/* Сообщение после разгадки */}
            {isSolved ? (
              <div className="mt-8 md:mt-10">
                <p className="text-sm md:text-[15px] text-white/65 max-w-lg">
                  Я очень люблю пасхалки. Особенно когда они ведут ещё куда-то.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 md:px-7 md:py-3.5 rounded-full border border-[#A6FF00]/50 bg-[#A6FF00]/10 text-[#A6FF00] font-p95 text-[11px] md:text-[12px] tracking-[0.2em] uppercase hover:bg-[#A6FF00] hover:text-black transition-colors no-underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Вернуться
                </Link>
              </div>
            ) : null}

          </div>
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
