"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const MaskContainer = ({
  children,
  revealText,
  size = 10,
  revealSize = 600,
  className,
  maskClassName,
  autoReveal = false,
  revealed = false,
  revealDuration = 0.3,
}: {
  children?: string | React.ReactNode;
  revealText?: string | React.ReactNode;
  size?: number;
  revealSize?: number;
  className?: string;
  maskClassName?: string;
  /** Drive the mask from the `revealed` prop (from the container centre) instead of the cursor. */
  autoReveal?: boolean;
  revealed?: boolean;
  /** Seconds the mask takes to grow when `autoReveal` is on. */
  revealDuration?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState<any>({ x: null, y: null });
  const containerRef = useRef<any>(null);
  const updateMousePosition = (e: any) => {
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (autoReveal) {
      const center = () => {
        const rect = el.getBoundingClientRect();
        setMousePosition({ x: rect.width / 2, y: rect.height / 2 });
      };
      center();
      window.addEventListener("resize", center);
      return () => window.removeEventListener("resize", center);
    }
    el.addEventListener("mousemove", updateMousePosition);
    return () => {
      el.removeEventListener("mousemove", updateMousePosition);
    };
  }, [autoReveal]);
  const grown = autoReveal ? revealed : isHovered;
  const maskSize = grown ? revealSize : size;

  return (
    <div ref={containerRef} className={cn("relative h-screen", className)}>
      <motion.div
        className={cn(
          "absolute flex h-full w-full items-center justify-center [mask-image:url(/mask.svg)] [mask-repeat:no-repeat] [mask-size:40px]",
          maskClassName,
        )}
        animate={{
          maskPosition: `${mousePosition.x - maskSize / 2}px ${
            mousePosition.y - maskSize / 2
          }px`,
          maskSize: `${maskSize}px`,
        }}
        transition={{
          maskSize: autoReveal
            ? { duration: revealDuration, ease: [0.65, 0, 0.35, 1] }
            : { duration: 0.3, ease: "easeInOut" },
          maskPosition: autoReveal
            ? { duration: 0 }
            : { duration: 0.15, ease: "linear" },
        }}
      >
        <div
          onMouseEnter={autoReveal ? undefined : () => setIsHovered(true)}
          onMouseLeave={autoReveal ? undefined : () => setIsHovered(false)}
          className="relative z-20 mx-auto max-w-4xl text-center"
        >
          {children}
        </div>
      </motion.div>

      <div className="flex h-full w-full items-center justify-center">
        {revealText}
      </div>
    </div>
  );
};
