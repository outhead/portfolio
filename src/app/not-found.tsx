import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative z-[1] min-h-[80vh] flex flex-col items-center justify-center px-5 bg-black">
      <div className="text-center">
        <h1 className="font-p95 text-[clamp(80px,20vw,200px)] leading-none text-white/10 mb-4">
          404
        </h1>
        <p className="text-sm tracking-[0.12em] uppercase text-white/40 mb-8">
          Страница не найдена
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#A6FF00] text-black hover:bg-[#B8FF33] rounded-lg px-6 py-3 text-sm font-semibold transition-colors no-underline uppercase tracking-[0.08em]"
        >
          На главную
        </Link>
      </div>
    </section>
  );
}
