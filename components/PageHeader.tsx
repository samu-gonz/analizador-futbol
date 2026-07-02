import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-10">
      <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        {eyebrow}
      </p>
      <h1 className="font-display text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
        {description}
      </p>
    </header>
  );
}
