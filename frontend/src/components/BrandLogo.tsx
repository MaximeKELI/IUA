type Props = {
  variant?: "color" | "white";
  className?: string;
  priority?: boolean;
};

/** IUA wordmark — SVG with literal letters I-U-A. */
export function BrandLogo({ variant = "color", className = "h-11 w-auto", priority = false }: Props) {
  const src = variant === "white" ? "/brand/logo-iua-white-v2.svg" : "/brand/logo-iua-v2.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Institut Universitaire d'Abidjan — IUA"
      width={520}
      height={140}
      className={className}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
