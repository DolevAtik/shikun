"use client";

import Image from "next/image";
import { cn } from "@moch/ui";

interface MediaImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Intrinsic size when known — improves CLS. Falls back to a 16:9 placeholder. */
  width?: number | null;
  height?: number | null;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
}

/**
 * Remote media through `next/image`. Local ministry assets (`/…`) stay on plain
 * `<img>` — they do not need the optimizer.
 */
export function MediaImage({
  src,
  alt,
  className,
  width,
  height,
  sizes = "100vw",
  priority = false,
  fill = false,
}: MediaImageProps) {
  if (src.startsWith("/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  const w = width && width > 0 ? width : 1200;
  const h = height && height > 0 ? height : 675;

  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
