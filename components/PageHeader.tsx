import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-4 sm:mb-8">
      <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300 sm:mb-3 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.2em]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        {eyebrow}
      </p>
      <h1 className="font-display text-xl font-black tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-slate-400 sm:block sm:text-base">
        {description}
      </p>
    </header>
  );
}
