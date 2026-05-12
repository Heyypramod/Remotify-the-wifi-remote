import { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { BottomNavBar } from "./components/BottomNavBar";
import { HomeRemote } from "./screens/HomeRemote";
import { AppsScreen } from "./screens/AppsScreen";
import { CastScreen } from "./screens/CastScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { useSettings } from "./context/SettingsContext";

import { AmbientBackground } from "./components/AmbientBackground";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("remotify_onboarding_completed");
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const getTransition = () => {
    switch (settings.motionIntensity) {
      case 'reduced':
        return { duration: 0.15 };
      case 'normal':
        return { type: "spring" as const, bounce: 0, duration: 0.4 };
      case 'expressive':
      default:
        return { type: "spring" as const, bounce: 0.2, duration: 0.6 };
    }
  };

  return (
    <MotionConfig transition={getTransition()}>
      <div className="h-[100dvh] max-h-[100dvh] w-full bg-m3-background flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl shadow-m3-outline/20">
        {settings.ambientBackground && <AmbientBackground />}
        
        <AnimatePresence>
          {showOnboarding && (
            <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
          )}
        </AnimatePresence>

        <main className="flex-1 px-6 sm:px-8 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+8.75rem)] overflow-y-auto overflow-x-hidden relative scroll-smooth z-10 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: settings.motionIntensity === 'reduced' ? 1 : 0.96, y: settings.motionIntensity === 'reduced' ? 0 : 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: settings.motionIntensity === 'reduced' ? 1 : 0.96, y: settings.motionIntensity === 'reduced' ? 0 : -15 }}
              className="pt-2 sm:pt-4 flex-1 flex flex-col w-full min-h-[500px]"
            >
              {activeTab === "home" && <HomeRemote />}
              {activeTab === "apps" && <AppsScreen />}
              {activeTab === "cast" && <CastScreen />}
              {activeTab === "settings" && <SettingsScreen />}
            </motion.div>
          </AnimatePresence>
        </main>

        {!showOnboarding && <BottomNavBar activeId={activeTab} onNavigate={setActiveTab} />}
      </div>
    </MotionConfig>
  );
}

