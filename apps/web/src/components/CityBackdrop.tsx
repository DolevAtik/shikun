/**
 * A housing skyline. Decorative only — it never carries text, so a screen
 * reader skips it. Buildings sit on the bottom edge and a crane marks a site
 * still under construction.
 */
export function CityBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[42vh]"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 0%, var(--sky-glow), transparent 70%)",
        }}
      />
      <svg
        viewBox="0 0 360 120"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-36 w-full overflow-hidden text-brand opacity-20 dark:opacity-30"
      >
        <Skyline />
      </svg>
    </div>
  );
}

/** The same silhouette, cropped into the header. */
export function HeaderSkyline() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 48"
      preserveAspectRatio="xMidYMax slice"
      className="block h-8 w-full text-black/25"
    >
      <Skyline />
    </svg>
  );
}

function Skyline() {
  return (
    <g fill="currentColor">
      <rect x="0" y="78" width="28" height="42" />
      <rect x="8" y="86" width="5" height="6" fill="var(--sky-glow)" opacity="0.9" />
      <rect x="18" y="86" width="5" height="6" fill="var(--sky-glow)" opacity="0.9" />
      <rect x="32" y="52" width="36" height="68" />
      <rect x="38" y="60" width="7" height="8" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="50" y="60" width="7" height="8" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="38" y="76" width="7" height="8" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="50" y="76" width="7" height="8" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="72" y="66" width="22" height="54" />
      <rect x="98" y="40" width="44" height="80" />
      <rect x="106" y="50" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="120" y="50" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="106" y="66" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="120" y="66" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="146" y="58" width="26" height="62" />
      <path d="M160 58 V28 H164 V58 Z" />
      <path d="M164 30 H198" stroke="currentColor" strokeWidth="2" />
      <path d="M190 30 V46" stroke="currentColor" strokeWidth="1.5" />
      <rect x="186" y="46" width="8" height="5" />
      <rect x="176" y="70" width="30" height="50" />
      <rect x="210" y="48" width="40" height="72" />
      <rect x="218" y="56" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="232" y="56" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="218" y="72" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="232" y="72" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="254" y="64" width="24" height="56" />
      <rect x="282" y="36" width="48" height="84" />
      <rect x="290" y="46" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="304" y="46" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="318" y="46" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="290" y="62" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="304" y="62" width="8" height="9" fill="var(--sky-glow)" opacity="0.85" />
      <rect x="334" y="72" width="26" height="48" />
    </g>
  );
}
