import { motion } from "motion/react";
import React, { ReactNode } from "react";

interface RemoteButtonProps {
  icon?: ReactNode;
  label?: string;
  variant?: 'primary' | 'surface' | 'tonal';
  size?: 'sm' | 'md' | 'lg' | 'pill';
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  whileTap?: any;
  style?: React.CSSProperties;
}

export function RemoteButton({ icon, label, variant = 'surface', size = 'md', onClick, isActive, className = '', whileTap = { scale: 0.88 }, style }: RemoteButtonProps) {
  const baseClasses = "relative flex items-center justify-center overflow-hidden transition-colors duration-300 shadow-sm border border-m3-outline/5";
  
  const getVariantStyles = () => {
    if (isActive && variant === 'surface') {
       return "bg-m3-surface-variant text-m3-on-surface border-m3-outline/20";
    }
    
    switch (variant) {
      case 'primary': return "bg-m3-primary text-m3-on-primary hover:bg-m3-primary/90 shadow-[0_6px_16px_rgba(255,155,84,0.3),inset_0_2px_6px_rgba(255,255,255,0.3)]";
      case 'tonal': return "bg-m3-secondary-container text-m3-on-secondary-container hover:bg-m3-secondary-container/80 shadow-[0_4px_12px_rgba(36,31,26,0.05)]";
      case 'surface':
      default:
         return "bg-m3-elevated dark:bg-m3-surface-variant/30 text-m3-on-surface hover:bg-m3-surface border-m3-outline/20 dark:border-white/5 backdrop-blur-xl shadow-[0_8px_24px_rgba(36,31,26,0.06),inset_0_2px_4px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.2),inset_0_1px_4px_rgba(255,255,255,0.05)]";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm': return "w-10 h-10 rounded-[14px]";
      case 'lg': return "w-16 h-16 rounded-[24px]";
      case 'pill': return "px-6 py-3 rounded-[20px] aspect-auto";
      case 'md':
      default: return "w-14 h-14 rounded-[20px]";
    }
  };

  return (
    <motion.button
      whileTap={whileTap}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`group ${baseClasses} ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      style={style}
    >
      {/* Edge Reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />

      {/* Hover ambient light */}
      {(variant === 'surface' || variant === 'tonal') && (
         <div className="absolute inset-0 bg-m3-primary/0 group-hover:bg-m3-primary/5 transition-colors duration-500 pointer-events-none" />
      )}

      <div className="flex flex-col items-center justify-center gap-0.5 z-10 relative">
        {icon}
        {label && <span className="text-[10px] font-display font-medium tracking-wide">{label}</span>}
      </div>
      {isActive && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-m3-primary-glow/20 blur-md pointer-events-none dark:mix-blend-screen"
        />
      )}
    </motion.button>
  );
}
