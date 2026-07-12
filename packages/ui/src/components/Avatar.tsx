import { cn } from "../cn";

export interface AvatarProps {
  name: string;
  initials: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const;

export function Avatar({ name, initials, src, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-brand-soft font-semibold text-brand",
        SIZES[size],
        className,
      )}
    >
      {src ? (
        // The name is already announced by the surrounding text, so the image is
        // decorative here — an empty alt keeps a screen reader from saying it twice.
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}
