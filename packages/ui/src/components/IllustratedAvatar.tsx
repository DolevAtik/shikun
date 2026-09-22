import { useId } from "react";
import { cn } from "../cn";

export interface IllustratedAvatarProps {
  /**
   * Cosmetic milestones, independent of the ring around the figure.
   * 5 unlocks a lapel pin, 10 a skyline behind the figure, 15 a frame.
   */
  level?: number;
  className?: string;
}

/**
 * The personal figure. It is an illustration, not a photo and not a generic
 * person icon — photos stay on the feed and the profile.
 *
 * Fills are the Ministry palette as fixed illustration colors. They do not
 * follow the dark-mode text inversion, or the hair would turn pale.
 */
export function IllustratedAvatar({ level = 1, className }: IllustratedAvatarProps) {
  const clipId = useId();
  const pin = level >= 5;
  const skyline = level >= 10;
  const framed = level >= 15;

  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className={cn("size-full", className)}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="80" r="80" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="160" height="160" fill="#f6e4d2" />
        <circle cx="118" cy="36" r="28" fill="#f6c98a" opacity="0.55" />
        {skyline ? (
          <g fill="#3d2918" opacity="0.16">
            <rect x="8" y="96" width="18" height="64" />
            <rect x="30" y="78" width="22" height="82" />
            <rect x="118" y="88" width="16" height="72" />
            <rect x="136" y="70" width="20" height="90" />
          </g>
        ) : null}
        <path d="M18 168c8-46 28-62 62-62s54 16 62 62" fill="#7a3412" />
        <path d="M62 112l18 22 18-22" fill="#fff8f0" />
        <path d="M68 104h24v16H68z" fill="#e4c4a8" />
        <circle cx="80" cy="74" r="28" fill="#e8c9ad" />
        <path
          d="M52 76c1-28 14-40 28-40 18 0 30 14 30 34 0 4-1 8-2 10-2-16-12-26-28-26-14 0-24 8-28 22z"
          fill="#3d2918"
        />
        <path d="M58 70c6-8 14-10 22-8" fill="none" stroke="#3d2918" strokeWidth="3" strokeLinecap="round" />
        {pin ? <circle cx="108" cy="124" r="6" fill="#8a5d0c" /> : null}
        {pin ? <circle cx="108" cy="124" r="2.5" fill="#f6c98a" /> : null}
      </g>
      {framed ? (
        <circle cx="80" cy="80" r="76" fill="none" stroke="#58419c" strokeWidth="3" />
      ) : null}
    </svg>
  );
}
