import Link from "next/link";
import LedText from "@/components/LedText";

export default function NotFound() {
  return (
    <section className="relative z-[1] min-h-[80vh] flex flex-col items-center justify-center px-5 bg-black">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-white/15 mb-6">
          <span className="sr-only">404</span>
          <LedText text="404" scale={2} dot={1.45} className="h-[60px] md:h-[100px] w-auto" />
        </h1>
        <p className="text-white/40 mb-8">
          <span className="sr-only">Страница не найдена</span>
          <LedText text="Страница не найдена" className="h-[9px] w-auto" />
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#A6FF00] text-black hover:bg-[#B8FF33] rounded-lg px-6 py-3 transition-colors no-underline"
        >
          <span className="sr-only">На главную</span>
          <LedText text="На главную" className="h-[11px] w-auto" />
        </Link>
      </div>
    </section>
  );
}
