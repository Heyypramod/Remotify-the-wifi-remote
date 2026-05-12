import { useRef, ReactNode } from "react";
import { motion } from "motion/react";

interface ExpressiveSliderProps {
  value: number;
  onChange: (value: number) => void;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export function ExpressiveSlider({ value, onChange, iconStart, iconEnd }: ExpressiveSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleDrag = (event: any) => {
    if (!containerRef.current) return;
    const { width, left } = containerRef.current.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    if (!clientX) return;
    
    let newValue = ((clientX - left) / width) * 100;
    newValue = Math.max(0, Math.min(100, newValue));
    onChange(newValue);
  };

  return (
    <div className="w-full flex items-center gap-4 group">
      {iconStart && <div className="text-m3-on-surface-variant transition-colors group-hover:text-m3-primary">{iconStart}</div>}
      
      <div 
        ref={containerRef}
        className="flex-1 relative h-12 flex items-center cursor-pointer overflow-visible"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const newValue = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
          onChange(newValue);
        }}
      >
        {/* Track Background Glow */}
        <div className="absolute inset-x-0 h-3 bg-m3-surface-variant rounded-[12px] overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-m3-primary relative" 
            animate={{ width: `${value}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Inner track shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] animate-ambient-shift mix-blend-overlay" />
          </motion.div>
        </div>
        
        {/* Glow beneath thumb */}
        <motion.div
           className="absolute w-12 h-12 bg-m3-primary/30 rounded-full blur-[12px] z-0 pointer-events-none"
           animate={{ left: `calc(${value}% - 24px)` }}
           transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Thumb */}
        <motion.div 
          className="absolute w-8 h-8 rounded-[12px] bg-m3-primary shadow-[0_8px_16px_rgba(255,155,84,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)] border-2 border-m3-surface flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
          animate={{ left: `calc(${value}% - 16px)` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={containerRef}
          onDrag={handleDrag}
          dragElastic={0}
          dragMomentum={false}
        >
          <div className="w-1.5 h-1.5 bg-m3-on-primary rounded-[4px] opacity-60" />
        </motion.div>
      </div>
      
      {iconEnd && <div className="text-m3-on-surface-variant">{iconEnd}</div>}
    </div>
  );
}
