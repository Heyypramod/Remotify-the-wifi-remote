import { useState } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { motion } from "motion/react";

export function VolumeSlider() {
  const [volume, setVolume] = useState(65);

  return (
    <div className="w-full flex items-center gap-4 px-2" id="remote-volume-container">
      <button 
        onClick={() => setVolume(v => v === 0 ? 50 : 0)}
        className="text-m3-on-surface-variant hover:text-m3-primary transition-colors"
      >
        {volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 50 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      
      <div className="flex-1 relative h-12 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-2 bg-m3-surface-variant rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-m3-primary" 
            animate={{ width: `${volume}%` }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          />
        </div>
        
        {/* Input for interaction */}
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value))}
          className="absolute inset-x-0 h-full opacity-0 cursor-pointer z-10"
          id="volume-range-input"
        />
        
        {/* Thumb simulation */}
        <motion.div 
          className="absolute w-5 h-5 bg-m3-primary border-4 border-m3-surface rounded-full shadow-md pointer-events-none"
          animate={{ left: `calc(${volume}% - 10px)` }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        />
      </div>
      
      <span className="text-xs font-mono font-medium text-m3-on-surface-variant min-w-[32px]">
        {Math.round(volume)}%
      </span>
    </div>
  );
}
