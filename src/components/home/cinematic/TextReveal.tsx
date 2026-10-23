import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTextReveal } from "../hooks/useCinematicMotion";

export function TextReveal({
  children,
  still,
  className = "",
}: {
  children: ReactNode;
  still: boolean;
  className?: string;
}) {
  const { ref, visible } = useTextReveal();
  return (
    <div ref={ref} className={`cinema-text-mask ${className}`}>
      <motion.div
        initial={false}
        animate={{ y: still || visible ? "0%" : "105%" }}
        transition={{ duration: still ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
