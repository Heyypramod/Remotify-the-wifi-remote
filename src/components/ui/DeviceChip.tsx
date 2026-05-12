import { motion } from "motion/react";
import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface DeviceChipProps {
  icon?: ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function DeviceChip({ icon, label, isActive, onClick }: DeviceChipProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative overflow-hidden flex items-center justify-between gap-3 px-5 py-2.5 min-w-[180px] rounded-[20px] border transition-all duration-300 ${
        isActive 
          ? "bg-m3-primary/10 border-m3-primary/20 text-m3-on-surface" 
          : "bg-m3-surface-variant/40 border-m3-outline/10 text-m3-on-surface hover:bg-m3-surface-variant/60"
      }`}
    >
      <div className="relative z-10 flex items-center gap-2">
        {icon && <span className="w-5 h-5 flex items-center justify-center text-m3-primary">{icon}</span>}
        <span className="text-sm font-medium tracking-wide">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 opacity-50 relative z-10" />
    </motion.button>
  );
}
