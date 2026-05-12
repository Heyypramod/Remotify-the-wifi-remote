import { ReactNode } from "react";
import { motion } from "motion/react";

interface AnimatedIconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  variant?: 'surface' | 'primary' | 'tonal';
}

export function AnimatedIconButton({ icon, onClick, isActive, className = "", variant = 'surface' }: AnimatedIconButtonProps) {
  const getVariantStyles = () => {
    if (isActive) {
      if (variant === 'primary') return "bg-m3-primary text-m3-on-primary";
      return "bg-m3-primary-container text-m3-on-primary-container";
    }
    
    switch (variant) {
      case 'primary': return "bg-m3-primary text-m3-on-primary";
      case 'tonal': return "bg-m3-secondary-container text-m3-on-secondary-container";
      case 'surface':
      default: return "bg-m3-surface hover:bg-m3-surface-variant text-m3-on-surface shadow-sm border border-m3-outline/20";
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`relative p-3 rounded-[16px] flex items-center justify-center transition-colors duration-300 ${getVariantStyles()} ${className}`}
    >
      {isActive && (
        <motion.div
           layoutId="icon-btn-glow"
           className="absolute inset-0 bg-m3-primary/20 rounded-[16px] blur-md"
        />
      )}
      <motion.div 
        className="relative z-10"
        initial={false}
        animate={{ rotate: isActive ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {icon}
      </motion.div>
    </motion.button>
  );
}
