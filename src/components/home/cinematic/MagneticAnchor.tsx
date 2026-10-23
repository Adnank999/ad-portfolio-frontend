import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useMagneticMotion } from "../hooks/useCinematicMotion";

export function MagneticAnchor({
  href,
  children,
  still,
  className = "",
}: {
  href: string;
  children: ReactNode;
  still: boolean;
  className?: string;
}) {
  const { x, y, onPointerMove, onPointerLeave } = useMagneticMotion(still);
  if (href.startsWith("/"))
    return (
      <motion.div
        style={{ x, y }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onBlur={onPointerLeave}
      >
        <Link to={href} className={`cinema-link ${className}`}>
          <span className="accent-text">{children}</span>
          <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
      </motion.div>
    );
  return (
    <motion.a
      href={href}
      className={`cinema-link ${className}`}
      style={{ x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onBlur={onPointerLeave}
    >
      <span className="accent-text">{children}</span>
      <ArrowUpRight size={20} aria-hidden="true" />
    </motion.a>
  );
}
