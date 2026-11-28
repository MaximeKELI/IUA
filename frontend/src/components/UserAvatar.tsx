"use client";

import type { AuthUser } from "@/lib/auth";

type AvatarUser = Pick<AuthUser, "first_name" | "last_name" | "full_name" | "email" | "avatar_url">;

function initialsOf(user: AvatarUser): string {
  const first = (user.first_name || "").trim();
  const last = (user.last_name || "").trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?";
  }
  const parts = (user.full_name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return (user.email || "?").charAt(0).toUpperCase();
}

/** Prefer same-origin /media path when Django returns an absolute localhost URL. */
function avatarSrc(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  try {
    if (avatarUrl.startsWith("/")) return avatarUrl;
    const u = new URL(avatarUrl);
    if (u.pathname.startsWith("/media/")) return u.pathname + u.search;
    return avatarUrl;
  } catch {
    return avatarUrl;
  }
}

export function UserAvatar({
  user,
  size = "md",
  className = "",
}: {
  user: AvatarUser;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const src = avatarSrc(user.avatar_url);
  const initials = initialsOf(user);
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
