export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#060a12]" />
      <div className="absolute inset-0 bg-mesh-gradient" />
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="orb -left-32 top-0 h-96 w-96 bg-emerald-500/20 animate-pulse-soft" />
      <div
        className="orb right-0 top-1/4 h-80 w-80 bg-cyan-500/15 animate-pulse-soft"
        style={{ animationDelay: "1s" }}
      />
      <div className="orb bottom-0 left-1/3 h-72 w-72 bg-indigo-500/10" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
    </div>
  );
}
