"use client";
import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const transition = {
  type: "spring" as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  href,
  current,
  children,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  href: string;
  current?: boolean;
  children?: React.ReactNode;
}) => {
  return (
    <div
      onMouseEnter={() => setActive(item)}
      onFocus={() => setActive(item)}
      className="relative"
    >
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        aria-haspopup={children ? "true" : undefined}
        aria-expanded={children ? active === item : undefined}
        className={cn(
          "block whitespace-nowrap rounded-full px-2.5 py-2 text-[14px] font-medium transition-colors xl:px-4 xl:text-[15px]",
          current
            ? "bg-brand-soft text-brand"
            : "text-ink hover:bg-brand-soft/60 hover:text-brand",
        )}
      >
        {item}
      </Link>
      {children && active === item && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          <div className="absolute left-1/2 top-[calc(100%_+_0.4rem)] -translate-x-1/2 pt-4">
            <motion.div
              transition={transition}
              layoutId="active" // layoutId ensures smooth animation
              className="overflow-hidden rounded-3xl border border-brand/10 bg-white shadow-[0_20px_50px_rgba(91,77,245,0.15)]"
            >
              <motion.div layout className="h-full w-max p-4">
                {children}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
  className,
  label,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
  className?: string;
  label: string;
}) => {
  return (
    <nav
      aria-label={label}
      onMouseLeave={() => setActive(null)} // resets the state
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setActive(null);
      }}
      className={cn(
        "relative flex items-center gap-1 rounded-full border border-white bg-white/80 p-1.5 shadow-[0_8px_30px_rgba(91,77,245,0.10)] backdrop-blur-md",
        className,
      )}
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  icon,
  iconBg,
}: {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  iconBg?: string;
}) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl p-2 hover:bg-brand-soft/60"
    >
      {icon ? (
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full",
            iconBg,
          )}
        >
          {icon}
        </span>
      ) : null}
      <span>
        <span className="block text-base font-semibold text-ink">{title}</span>
        <span className="block max-w-[13rem] text-sm text-body">
          {description}
        </span>
      </span>
    </Link>
  );
};

export const HoveredLink = ({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) => {
  return (
    <Link
      href={href}
      className={cn("text-body hover:text-brand", className)}
    >
      {children}
    </Link>
  );
};
