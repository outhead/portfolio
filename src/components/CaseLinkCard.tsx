import Image from "next/image";
import { ExternalLink, Play } from "lucide-react";

export interface CaseLinkData {
  label: string;
  url: string;
  thumbnail?: string;
  kind?: "video" | "article" | "site" | "github";
  category?: string;
}

interface CaseLinkCardProps {
  link: CaseLinkData;
  /** sm — для inline section.links (компактнее), md — для нижнего bar (крупнее) */
  size?: "sm" | "md";
}

/**
 * Единый рендер карточки-ссылки на странице кейса.
 * Используется и inline в section.links, и в нижнем bar project.links.
 *
 * - Если `thumbnail` задан → миниатюра слева + текст справа.
 *   Если `kind === "video"` → поверх миниатюры play-иконка в круге.
 * - Если `thumbnail` нет → текстовая карточка с domain + label + ExternalLink.
 */
export default function CaseLinkCard({ link, size = "md" }: CaseLinkCardProps) {
  let domain = "";
  try {
    domain = new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    /* invalid URL → пустой domain */
  }

  const hasThumb = !!link.thumbnail;
  const isVideo = link.kind === "video";

  const thumbWidth = size === "sm" ? "w-28 md:w-32" : "w-32 md:w-40";
  const sizesAttr = size === "sm" ? "128px" : "160px";
  const playSize = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const playIcon = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const padding = size === "sm" ? "p-3" : "p-4";
  const labelText = size === "sm" ? "text-[13px]" : "text-sm";
  const domainText = "text-[11px] tracking-[0.05em] text-white/30 mb-1.5 truncate uppercase";

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      data-ym-goal="case_external_link"
      data-ym-goal-params={JSON.stringify({ kind: link.kind ?? "link", domain, category: link.category })}
      className="group flex items-stretch gap-0 rounded-md border border-white/[0.08] hover:border-[#A6FF00]/40 hover:bg-white/[0.02] transition-colors no-underline overflow-hidden"
    >
      {hasThumb && (
        <div className={`relative ${thumbWidth} flex-shrink-0 bg-black overflow-hidden`}>
          <Image
            src={link.thumbnail!}
            alt={link.label}
            fill
            sizes={sizesAttr}
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/15 transition-colors">
              <div
                className={`${playSize} rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#A6FF00] transition-colors`}
              >
                <Play
                  className={`${playIcon} text-white group-hover:text-black transition-colors fill-current ml-0.5`}
                  strokeWidth={2}
                />
              </div>
            </div>
          )}
        </div>
      )}
      <div className={`flex items-start gap-3 ${padding} flex-1 min-w-0`}>
        <div className="flex-1 min-w-0">
          <div className={domainText}>{domain}</div>
          <div className={`${labelText} text-white/70 group-hover:text-white transition-colors leading-snug`}>
            {link.label}
          </div>
        </div>
        <ExternalLink
          className="w-3.5 h-3.5 flex-shrink-0 text-white/25 group-hover:text-[#A6FF00] transition-colors mt-0.5"
          strokeWidth={2}
        />
      </div>
    </a>
  );
}
