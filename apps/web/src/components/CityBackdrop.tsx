import { cn } from "@moch/ui";

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
        className="absolute inset-x-0 bottom-0 h-44 w-full overflow-hidden text-brand opacity-30 dark:opacity-40 rtl:-scale-x-100"
      >
        <Skyline />
      </svg>
    </div>
  );
}

/** The same silhouette, cropped into the header so roofs fill the strip. */
export function HeaderSkyline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 56"
      preserveAspectRatio="xMidYMax slice"
      className={cn("block h-9 w-full text-black/30 dark:text-white/20 rtl:-scale-x-100", className)}
    >
      <g transform="translate(0 -64)">
        <Skyline />
      </g>
    </svg>
  );
}

/**
 * A short roof strip for hero cards and greetings. Sits behind content;
 * never carries meaning on its own.
 */
export function SkylineStrip({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 56"
      preserveAspectRatio="xMidYMax slice"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full overflow-hidden text-brand/25 dark:text-brand/35 rtl:-scale-x-100",
        className,
      )}
    >
      <g transform="translate(0 -64)">
        <Skyline />
      </g>
    </svg>
  );
}

/** Compact building cluster for a card cover with no photo. */
export function BuildingCoverArt({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative grid h-28 shrink-0 place-items-end overflow-hidden bg-gradient-to-bl from-surface-tint to-surface-sunken",
        className,
      )}
    >
      <svg
        viewBox="0 0 160 72"
        preserveAspectRatio="xMidYMax meet"
        className="h-[4.5rem] w-full text-brand/40 dark:text-brand/50 rtl:-scale-x-100"
      >
        <g fill="currentColor">
          <rect x="12" y="28" width="28" height="44" />
          <rect x="18" y="34" width="5" height="6" className="skyline-window" fill="var(--sky-glow)" opacity="0.9" />
          <rect x="28" y="34" width="5" height="6" className="skyline-window skyline-window--delay" fill="var(--sky-glow)" opacity="0.85" />
          <rect x="18" y="46" width="5" height="6" className="skyline-window skyline-window--delay-2" fill="var(--sky-glow)" opacity="0.85" />
          <rect x="44" y="12" width="36" height="60" />
          <rect x="52" y="20" width="6" height="7" className="skyline-window" fill="var(--sky-glow)" opacity="0.9" />
          <rect x="66" y="20" width="6" height="7" className="skyline-window skyline-window--delay" fill="var(--sky-glow)" opacity="0.85" />
          <rect x="52" y="34" width="6" height="7" className="skyline-window skyline-window--delay-2" fill="var(--sky-glow)" opacity="0.85" />
          <rect x="66" y="34" width="6" height="7" className="skyline-window" fill="var(--sky-glow)" opacity="0.9" />
          <rect x="86" y="22" width="22" height="50" />
          <rect x="92" y="30" width="5" height="6" className="skyline-window skyline-window--delay" fill="var(--sky-glow)" opacity="0.85" />
          <rect x="114" y="8" width="32" height="64" />
          <rect x="122" y="16" width="6" height="7" className="skyline-window" fill="var(--sky-glow)" opacity="0.9" />
          <rect x="134" y="16" width="6" height="7" className="skyline-window skyline-window--delay-2" fill="var(--sky-glow)" opacity="0.85" />
          <rect x="122" y="30" width="6" height="7" className="skyline-window skyline-window--delay" fill="var(--sky-glow)" opacity="0.85" />
        </g>
      </svg>
    </div>
  );
}

function Skyline() {
  return (
    <>
      {/* Distant, lighter neighbourhood — reads as depth behind the near street. */}
      <g fill="currentColor" opacity="0.35">
        <rect x="6" y="70" width="22" height="50" />
        <rect x="40" y="58" width="30" height="62" />
        <rect x="84" y="64" width="20" height="56" />
        <rect x="118" y="52" width="38" height="68" />
        <rect x="170" y="66" width="24" height="54" />
        <rect x="208" y="56" width="34" height="64" />
        <rect x="256" y="62" width="22" height="58" />
        <rect x="292" y="48" width="40" height="72" />
        <rect x="340" y="68" width="18" height="52" />
      </g>

      {/* Near street — roofs, windows, and a crane on a site still rising. */}
      <g fill="currentColor">
        <rect x="0" y="78" width="28" height="42" />
        <Window x={8} y={86} w={5} h={6} />
        <Window x={18} y={86} w={5} h={6} delay="delay" />

        <rect x="32" y="52" width="36" height="68" />
        <Window x={38} y={60} w={7} h={8} />
        <Window x={50} y={60} w={7} h={8} delay="delay" />
        <Window x={38} y={76} w={7} h={8} delay="delay-2" />
        <Window x={50} y={76} w={7} h={8} />

        <rect x="72" y="66" width="22" height="54" />
        <Window x={78} y={74} w={5} h={6} delay="delay" />

        <rect x="98" y="40" width="44" height="80" />
        <Window x={106} y={50} w={8} h={9} />
        <Window x={120} y={50} w={8} h={9} delay="delay" />
        <Window x={106} y={66} w={8} h={9} delay="delay-2" />
        <Window x={120} y={66} w={8} h={9} />
        <Window x={106} y={82} w={8} h={9} delay="delay" />
        <Window x={120} y={82} w={8} h={9} delay="delay-2" />

        <rect x="146" y="58" width="26" height="62" />
        <Window x={152} y={66} w={5} h={6} />

        {/* Crane — the site that is still under construction. */}
        <path d="M160 58 V28 H164 V58 Z" />
        <path d="M164 30 H198" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M190 30 V46" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="186" y="46" width="8" height="5" />
        <rect x="176" y="70" width="30" height="50" />

        <rect x="210" y="48" width="40" height="72" />
        <Window x={218} y={56} w={8} h={9} />
        <Window x={232} y={56} w={8} h={9} delay="delay" />
        <Window x={218} y={72} w={8} h={9} delay="delay-2" />
        <Window x={232} y={72} w={8} h={9} />
        <Window x={218} y={88} w={8} h={9} delay="delay" />

        <rect x="254" y="64" width="24" height="56" />
        <Window x={260} y={72} w={5} h={6} delay="delay-2" />

        <rect x="282" y="36" width="48" height="84" />
        <Window x={290} y={46} w={8} h={9} />
        <Window x={304} y={46} w={8} h={9} delay="delay" />
        <Window x={318} y={46} w={8} h={9} delay="delay-2" />
        <Window x={290} y={62} w={8} h={9} delay="delay" />
        <Window x={304} y={62} w={8} h={9} />
        <Window x={318} y={62} w={8} h={9} delay="delay-2" />
        <Window x={290} y={78} w={8} h={9} />
        <Window x={304} y={78} w={8} h={9} delay="delay" />

        <rect x="334" y="72" width="26" height="48" />
        <Window x={340} y={80} w={5} h={6} delay="delay-2" />
      </g>
    </>
  );
}

function Window({
  x,
  y,
  w,
  h,
  delay,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  delay?: "delay" | "delay-2";
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill="var(--sky-glow)"
      opacity="0.9"
      className={cn("skyline-window", delay === "delay" && "skyline-window--delay", delay === "delay-2" && "skyline-window--delay-2")}
    />
  );
}
