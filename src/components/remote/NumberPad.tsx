import { motion } from "motion/react";

export function NumberPad() {
  const keys = [
    { id: "1", label: "1" },
    { id: "2", label: "2" },
    { id: "3", label: "3" },
    { id: "4", label: "4" },
    { id: "5", label: "5" },
    { id: "6", label: "6" },
    { id: "7", label: "7" },
    { id: "8", label: "8" },
    { id: "9", label: "9" },
    { id: "tv", label: "TV", isSecondary: true },
    { id: "0", label: "0" },
    { id: "menu", label: "Menu", isAction: true },
  ];

  return (
    <div
      className="relative w-full h-full bg-m3-surface-variant/40 dark:bg-[#1A1A1E] rounded-[32px] sm:rounded-[40px] flex flex-col p-4 sm:p-5 border border-m3-outline/20 dark:border-m3-outline/5 shadow-inner"
      id="remote-numberpad"
    >
      <div className="absolute top-5 left-6 z-20">
        <span className="text-[11px] font-bold tracking-[0.15em] text-[#7A6858] dark:text-[#D8B4C0] uppercase">
          Number Pad
        </span>
      </div>

      <div className="grid grid-cols-3 grid-rows-4 gap-3 sm:gap-4 mt-8 h-full place-items-stretch">
        {keys.map((key) => (
          <motion.button
            key={key.id}
            whileTap={{ scale: 0.95 }}
            className={`w-full h-full rounded-[24px] flex flex-col justify-center items-center transition-colors relative overflow-hidden group border border-black/5 dark:border-white/5 ${
              key.isAction
                ? "bg-m3-primary text-m3-on-primary shadow-sm"
                : key.isSecondary
                ? "bg-m3-secondary-container text-m3-on-secondary-container"
                : "bg-m3-elevated dark:bg-[#2F3036] text-m3-on-surface dark:text-[#E0E2EC] hover:bg-m3-surface border-m3-outline/20 dark:hover:bg-[#3B3D44] shadow-[0_4px_12px_rgba(36,31,26,0.06),inset_0_2px_4px_rgba(255,255,255,0.6)]"
            }`}
          >
            <span className={`relative z-10 flex flex-col items-center justify-center w-full`}>
              <span className={`text-[22px] font-medium ${key.isAction || key.isSecondary ? '!text-sm tracking-widest font-bold' : ''}`}>
                {key.label}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
