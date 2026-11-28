"use client";

import { resolveAvatarSrc, userInitials, type AuthUser } from "@/lib/auth";

export function UserAvatar({
  user,
  size = "md",
  className = "",
}: {
  user: Pick<AuthUser, "first_name" | "last_name" | "full_name" | "email" | "avatar_url">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const src = resolveAvatarSrc(user.avatar_url);
  const initials = userInitials(user);
  const sizes = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
    xl: "h-24 w-24 text-2xl",
  }[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={user.full_name || "Profil"}
        className={`${sizes} rounded-full object-cover ring-2 ring-white/30 ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex ${sizes} items-center justify-center rounded-full bg-iua-navy font-semibold tracking-wide text-white ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
