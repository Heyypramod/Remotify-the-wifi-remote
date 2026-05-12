import React from "react";
import { motion } from "motion/react";

export function AmbientBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base matte surface is inherited from the parent (bg-m3-background) */}

      {/* Atmospheric lighting gradients */}
      
      {/* Upper-Left: Warm Ivory Light */}
      <motion.div 
        className="absolute -top-[20%] -left-[20%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#F7F3EE] via-[#FFE6D2]/60 to-transparent blur-[80px]"
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Mid to Lower Right: Orange Warmth */}
      <motion.div 
        className="absolute top-[10%] left-[20%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FFC49B]/50 via-[#FF9B54]/30 to-transparent blur-[120px]"
        animate={{
          opacity: [0.5, 0.7, 0.5],
          x: ["-5%", "5%", "-5%"],
          y: ["-5%", "5%", "-5%"],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Outer Edges/Bottom: Charcoal Diffusion & Deep Warmth */}
      <div className="absolute -bottom-[30%] -right-[30%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#7A3B20]/40 via-[#1B1715]/20 to-transparent blur-[140px]" />
      
      {/* Very fine atmospheric noise & matte grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
    </div>
  );
}
