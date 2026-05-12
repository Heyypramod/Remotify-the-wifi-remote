import { ReactNode } from "react";
import { motion } from "motion/react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = "", onClick }: GlassCardProps) {
  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={onClick ? { type: "spring", stiffness: 400, damping: 17 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden bg-m3-surface-variant/[0.2] dark:bg-m3-surface-variant/[0.1] backdrop-blur-3xl border border-black/[0.03] dark:border-white/[0.03] rounded-[32px] ${onClick ? 'cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-m3-primary/50' : ''} ${className}`}
    >
      {/* Soft Ambient Inner Glow */}
      <div className="absolute inset-x-0 -top-10 h-32 bg-m3-primary/5 rounded-full blur-[40px] pointer-events-none" />
      
      {/* Top Edge Light */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </Component>
  );
}
