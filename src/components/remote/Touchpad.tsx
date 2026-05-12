import { motion } from "motion/react";
import { MousePointer2 } from "lucide-react";

export function Touchpad() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full aspect-square relative rounded-[48px] flex flex-col items-center justify-center overflow-hidden group cursor-crosshair shadow-[inset_0_2px_40px_rgba(255,155,84,0.03),0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_40px_rgba(255,155,84,0.03),0_8px_32px_rgba(0,0,0,0.2)] bg-m3-surface-variant/40"
      id="remote-touchpad"
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF9]/60 to-[#FFF6EC]/30 isolate pointer-events-none" />

      {/* Slow rotating conic glow */}
      <div 
        className="absolute w-[200%] h-[200%] opacity-20 pointer-events-none animate-conic-spin"
        style={{
          background: "conic-gradient(from 180deg at 50% 50%, transparent 0deg, var(--color-m3-primary-glow) 180deg, transparent 360deg)",
          filter: "blur(60px)"
        }}
      />
      
      {/* Ambient Pulse Core */}
      <div className="absolute w-64 h-64 bg-m3-primary/10 rounded-full blur-[80px] animate-ambient-pulse pointer-events-none dark:mix-blend-screen" />

      {/* Edge Reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
      
      {/* Interactive Glow Element (shows more on hover/active) */}
      <div className="absolute inset-0 bg-m3-primary/5 opacity-0 group-hover:opacity-100 group-active:bg-m3-primary/15 transition-all duration-700 ease-out pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <MousePointer2 className="w-8 h-8 text-m3-on-surface-variant/40 mb-3 group-active:scale-95 group-active:text-m3-primary/80 transition-all duration-500" />
        <span className="text-xs font-medium text-m3-on-surface-variant/40 uppercase tracking-widest group-hover:text-m3-on-surface-variant/70 transition-colors duration-500">
          Interaction Surface
        </span>
      </div>
    </motion.div>
  );
}
