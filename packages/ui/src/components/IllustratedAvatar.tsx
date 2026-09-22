import { useId } from "react";
import { cn } from "../cn";

export interface IllustratedAvatarProps {
  /**
   * Cosmetic milestones, independent of the ring around the figure.
   * 5 adds a lapel pin, 10 a badge, 15 a frame. Keep the cuts in step with
   * `avatarProgress` in the web app.
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
  const pin = level >= 5 && level < 10;
  const badge = level >= 10;
  const framed = level >= 15;

  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className={cn("size-full", className)}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="80" r="80" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="160" height="160" fill="#f3dcc4" />
        <circle cx="118" cy="28" r="36" fill="#f6c98a" opacity="0.85" />
        <ellipse cx="46" cy="128" rx="28" ry="18" fill="#e7c8a4" opacity="0.7" />
        <path d="M18 168c8-50 28-68 62-68s54 18 62 68" fill="#7a3412" />
        <path d="M62 108c6 16 10 26 18 34 8-8 12-18 18-34-4 6-12 10-18 10s-14-4-18-10z" fill="#fff8f0" />
        <path d="M68 102h24l-5 12H73z" fill="#e8c4a4" />
        <rect x="72" y="92" width="16" height="16" rx="4" fill="#e4c0a4" />
        <circle cx="80" cy="70" r="28" fill="#efd0b4" />
        <path
          d="M52 68c2-30 16-44 28-44 18 0 30 14 32 38-8-16-18-24-32-24-14 0-24 8-28 30z"
          fill="#3d2918"
        />
        <path d="M64 42c6-4 14-5 20-2" fill="none" stroke="#5c4030" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
        <path d="M63 62c4-3 9-3 13 0" fill="none" stroke="#3d2918" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M84 62c4-3 9-3 13 0" fill="none" stroke="#3d2918" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="70" cy="72" rx="2.3" ry="2.7" fill="#3d2918" />
        <ellipse cx="91" cy="72" rx="2.3" ry="2.7" fill="#3d2918" />
        <path d="M72 84c3.2 4.2 12.4 4.2 16 0" fill="none" stroke="#a45a48" strokeWidth="1.7" strokeLinecap="round" />
        {pin ? (
          <g>
            <circle cx="108" cy="122" r="7" fill="#8a5d0c" />
            <circle cx="108" cy="122" r="3" fill="#f6c98a" />
          </g>
        ) : null}
        {badge ? (
          <g>
            <path d="M100 128l5 16 5-16" fill="#58419c" />
            <path d="M112 128l5 16 5-16" fill="#7a3412" />
            <circle cx="111" cy="124" r="8" fill="#f6c98a" />
            <circle cx="111" cy="124" r="4" fill="#8a5d0c" />
          </g>
        ) : null}
      </g>
      {framed ? (
        <g fill="none">
          <circle cx="80" cy="80" r="74" stroke="#58419c" strokeWidth="3" />
          <circle cx="80" cy="80" r="78" stroke="#c9a15b" strokeWidth="1.5" />
        </g>
      ) : null}
    </svg>
  );
}
