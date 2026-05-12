import { motion, AnimatePresence } from "motion/react";
import { Home, LayoutGrid, Cast, Settings } from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: typeof Home;
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "apps", label: "Apps", icon: LayoutGrid },
  { id: "cast", label: "Cast", icon: Cast },
  { id: "settings", label: "Settings", icon: Settings },
];

interface BottomNavBarProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

export function BottomNavBar({ activeId, onNavigate }: BottomNavBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-[calc(8px+env(safe-area-inset-bottom))] px-4">
      <div className="w-full max-w-[340px] bg-m3-elevated/90 dark:bg-m3-surface-variant/50 backdrop-blur-2xl border border-m3-outline/30 rounded-[32px] flex items-center px-1.5 py-1.5 pointer-events-auto shadow-[0_16px_32px_rgba(36,31,26,0.06)] dark:border-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex items-center justify-center h-[52px] group z-10 transition-all duration-500 ease-out flex-shrink-0 ${
                isActive ? "flex-1" : "w-[60px]"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
              id={`nav-item-${item.id}`}
            >
              <div className="relative flex items-center justify-center h-[44px] w-full px-2">
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-pill"
                    className="absolute inset-0 bg-m3-primary-container dark:bg-m3-primary/20 rounded-[22px] -z-10 shadow-[inset_0_1px_4px_rgba(255,155,84,0.1)] dark:shadow-[inset_0_1px_4px_rgba(255,255,255,0.15)] glow-effect"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <motion.div
                  layout
                  className="flex items-center justify-center gap-2"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                >
                  <Icon
                    className={`shrink-0 transition-all duration-500 ${
                      isActive
                        ? "w-[22px] h-[22px] text-m3-primary drop-shadow-[0_2px_8px_rgba(255,155,84,0.4)] dark:drop-shadow-[0_2px_8px_rgba(255,179,106,0.3)]"
                        : "w-5 h-5 text-m3-inactive-icon group-hover:text-m3-on-surface-variant"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, width: 0, paddingLeft: 0, filter: "blur(4px)" }}
                        animate={{ opacity: 1, width: "auto", paddingLeft: 2, filter: "blur(0px)" }}
                        exit={{ opacity: 0, width: 0, paddingLeft: 0, filter: "blur(4px)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        className="text-[14px] font-semibold tracking-wide text-m3-on-primary-container dark:text-m3-on-surface whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
