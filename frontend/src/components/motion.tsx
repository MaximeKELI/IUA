"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ReactNode } from "react";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export function useMotionSafe() {
  const reduce = useReducedMotion();
  return !reduce;
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: easeOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: easeOut },
  },
};

export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "up" | "in" | "scale";
}) {
  const enabled = useMotionSafe();
  const variants = variant === "in" ? fadeIn : variant === "scale" ? scaleIn : fadeUp;

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const enabled = useMotionSafe();
  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

export { motion };
