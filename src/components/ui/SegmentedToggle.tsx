import { motion } from "motion/react";
import { ReactNode } from "react";

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: { id: T; label: string; icon?: ReactNode }[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedToggle<T extends string>({ value, options, onChange, className = "" }: SegmentedToggleProps<T>) {
  return (
    <div className={`relative flex bg-m3-surface-variant/40 dark:bg-m3-surface-variant/30 backdrop-blur-xl p-1.5 rounded-[24px] border border-black/5 dark:border-white/5 shadow-[inset_0_2px_4px_rgba(36,31,26,0.04)] overflow-hidden ${className}`}>
      {/* Ambient shift glow */}
      <div className="absolute inset-x-0 -top-4 h-8 bg-m3-primary/10 blur-[20px] animate-ambient-shift pointer-events-none dark:mix-blend-screen" />
      
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className="flex-1 relative flex items-center justify-center gap-2 py-2.5 rounded-[20px] text-sm font-medium z-10 group"
          >
            {isActive && (
              <motion.div
                layoutId="segment-active"
                className="absolute inset-0 bg-gradient-to-br from-m3-primary/20 via-m3-primary/10 to-transparent dark:from-m3-primary/30 dark:via-m3-primary/10 dark:to-transparent shadow-[0_0_12px_rgba(255,155,84,0.15)] rounded-[20px] border border-m3-primary/20 dark:border-m3-primary/30"
                transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-2 transition-colors duration-500 tracking-wide ${
              isActive 
                ? "text-[#FFF3EA] font-semibold drop-shadow-[0_2px_8px_rgba(255,155,84,0.3)]" 
                : "text-[#5F5752] dark:text-[rgba(255,255,255,0.72)] group-hover:text-[#3E3834] dark:group-hover:text-[rgba(255,255,255,0.9)]"
            }`}>
              {option.icon && (
                <span className={`${isActive ? "text-[#FF9B54] drop-shadow-[0_2px_8px_rgba(255,155,84,0.4)]" : "text-[#5F5752] dark:text-[rgba(255,255,255,0.72)]"} transition-colors duration-500`}>
                  {option.icon}
                </span>
              )}
              {option.label && <span>{option.label}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
