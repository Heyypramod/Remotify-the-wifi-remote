import { useState, ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  ChevronRight,
  Network,
  Coffee,
  Heart,
  Github,
  Globe,
  Monitor,
  Activity,
  Server,
  Zap,
  RotateCcw,
  RefreshCw,
  Edit2,
  Check
} from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { useSettings, MotionIntensity } from "../context/SettingsContext";
import { useRemote } from "../context/RemoteContext";
import { ConnectionState } from "../types/remote";
import { useHaptics } from "../hooks/useHaptics";

interface SettingsItemProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  hasToggle?: boolean;
  isToggled?: boolean;
  onToggle?: (val: boolean) => void;
  onClick?: () => void;
  children?: ReactNode;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  hasToggle,
  isToggled,
  onToggle,
  onClick,
  children
}: SettingsItemProps) {
  const { vibrate } = useHaptics();

  return (
    <div
      className={`flex flex-col py-3 px-2 ${onClick || hasToggle ? "cursor-pointer group" : ""}`}
      onClick={() => {
        if (hasToggle && onToggle) {
          vibrate(5);
          onToggle(!isToggled);
        }
        else if (onClick) {
          vibrate(5);
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-[14px] bg-m3-surface-variant flex items-center justify-center text-m3-on-surface-variant group-hover:bg-m3-primary/10 group-hover:text-m3-primary transition-colors shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-m3-on-surface font-medium text-sm group-hover:text-m3-primary transition-colors">
            {title}
          </h4>
          {subtitle && (
            <p className="text-m3-on-surface-variant text-xs truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {hasToggle && (
          <div
            className={`relative w-12 h-6 rounded-[12px] transition-colors duration-300 ${isToggled ? "bg-m3-primary" : "bg-m3-surface-variant"}`}
          >
            <motion.div
              className={`absolute top-1 w-4 h-4 rounded-[8px] bg-white shadow-sm flex items-center justify-center`}
              animate={{ left: isToggled ? "26px" : "4px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        )}
        
        {!hasToggle && onClick && !children && (
          <ChevronRight className="w-5 h-5 text-m3-on-surface-variant/50 group-hover:text-m3-primary transition-colors" />
        )}
      </div>
      {children && <div className="mt-3 w-full pl-14 pr-2">{children}</div>}
    </div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6">
      {title && (
        <h3 className="text-xs font-bold uppercase tracking-widest text-m3-on-surface-variant/70 ml-4 mb-3">
          {title}
        </h3>
      )}
      <GlassCard className="p-2 space-y-1">{children}</GlassCard>
    </section>
  );
}

export function SettingsScreen() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { connectionState, selectedDevice, reconnect, transport } = useRemote();
  const { vibrate } = useHaptics();

  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(settings.serverUrl);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Simulated Ping
  const [ping, setPing] = useState<number>(0);

  useEffect(() => {
    setUrlInput(settings.serverUrl);
  }, [settings.serverUrl]);

  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED) {
      const interval = setInterval(() => {
        setPing(Math.floor(Math.random() * 20) + 15);
      }, 5000);
      setPing(Math.floor(Math.random() * 20) + 15);
      return () => clearInterval(interval);
    } else {
      setPing(0);
    }
  }, [connectionState]);

  const handleSaveUrl = () => {
    updateSettings({ serverUrl: urlInput });
    setIsEditingUrl(false);
    vibrate(10);
    // Might want to reconnect here with new URL, handled by app level if needed.
  };

  const handleReset = () => {
    resetSettings();
    setShowResetModal(false);
    vibrate([10, 30, 20]);
  };

  const isConnected = connectionState === ConnectionState.CONNECTED;

  return (
    <div className="space-y-6 pb-20" id="settings-screen">
      {/* Header Profile -> Replaced with diagnostic connection card */}
      <div className="px-2 pt-2">
        <h2 className="text-3xl font-display font-bold text-m3-on-surface tracking-tight">
          Settings
        </h2>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="px-2 mb-8 mt-4"
      >
        <GlassCard className="p-5 relative overflow-hidden flex flex-col gap-4 border border-m3-outline/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-m3-primary/10 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-center justify-between z-10 relative">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm ${
                isConnected ? 'bg-m3-primary/10 border-m3-primary/20 text-m3-primary' : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-m3-on-surface text-lg leading-tight">
                  {isConnected ? 'Backend Online' : 'Backend Offline'}
                </h3>
                <p className="text-sm font-medium text-m3-on-surface-variant flex items-center gap-1.5 mt-1">
                   <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                   {connectionState} 
                   {isConnected && ping > 0 && <span className="opacity-70 ml-1">• {ping}ms</span>}
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { vibrate(5); reconnect(); }}
              className="w-10 h-10 rounded-full bg-m3-surface-variant/50 hover:bg-m3-surface-variant flex items-center justify-center text-m3-on-surface-variant"
            >
              <RefreshCw className={`w-5 h-5 ${connectionState === ConnectionState.CONNECTING ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>

          <div className="flex items-center justify-between p-3 bg-m3-surface-variant/30 rounded-2xl z-10 relative text-sm border border-m3-outline/5">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-m3-on-surface-variant" />
              <span className="font-medium text-m3-on-surface-variant">Active TV</span>
            </div>
            <span className="font-semibold text-m3-on-surface truncate max-w-[150px]">
              {selectedDevice ? selectedDevice.name : 'None'}
            </span>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div
         initial={{ y: 20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
      >
        <SettingsSection title="Appearance & Motion">
          <SettingsItem
            icon={<Zap className="w-5 h-5" />}
            title="Dynamic Ambient Background"
            subtitle="Animated glowing gradients behind the app"
            hasToggle
            isToggled={settings.ambientBackground}
            onToggle={(val) => updateSettings({ ambientBackground: val })}
          />
          <SettingsItem
            icon={<Activity className="w-5 h-5" />}
            title="Motion Intensity"
            subtitle="Controls animation speed & spring physics"
          >
            <div className="flex bg-m3-surface-variant/50 p-1 rounded-full w-full">
               {(['reduced', 'normal', 'expressive'] as MotionIntensity[]).map((level) => (
                 <button
                   key={level}
                   onClick={() => { vibrate(5); updateSettings({ motionIntensity: level }); }}
                   className={`flex-1 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                     settings.motionIntensity === level 
                       ? 'bg-m3-primary text-m3-on-primary shadow-sm' 
                       : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                   }`}
                 >
                   {level}
                 </button>
               ))}
            </div>
          </SettingsItem>
        </SettingsSection>
        
        <SettingsSection title="Interactions">
          <SettingsItem
            icon={<Volume2 className="w-5 h-5" />}
            title="Haptic Feedback"
            subtitle="Device vibration on button presses and touchpad"
            hasToggle
            isToggled={settings.hapticFeedback}
            onToggle={(val) => updateSettings({ hapticFeedback: val })}
          />
        </SettingsSection>

        <SettingsSection title="Connection & Network">
           <SettingsItem
            icon={<Network className="w-5 h-5" />}
            title="Auto Reconnect"
            subtitle="Automatically attempt to reconnect on drop"
            hasToggle
            isToggled={settings.autoReconnect}
            onToggle={(val) => updateSettings({ autoReconnect: val })}
          />
          <SettingsItem
            icon={<Monitor className="w-5 h-5" />}
            title="Remember Last Device"
            subtitle="Auto-select previously connected TV"
            hasToggle
            isToggled={settings.rememberLastDevice}
            onToggle={(val) => updateSettings({ rememberLastDevice: val })}
          />
          <SettingsItem
            icon={<Server className="w-5 h-5" />}
            title="WebSocket Server URL"
            subtitle={settings.serverUrl || "Default Auto-Discovery"}
            onClick={() => !isEditingUrl && setIsEditingUrl(true)}
          >
             {isEditingUrl && (
               <div className="flex items-center gap-2 mt-2">
                 <input 
                   type="text" 
                   value={urlInput}
                   onChange={(e) => setUrlInput(e.target.value)}
                   className="flex-1 bg-m3-surface-variant rounded-xl px-3 py-2 text-sm text-m3-on-surface border border-m3-outline/20 focus:border-m3-primary focus:outline-none"
                   placeholder="ws://ip:port/ws"
                   autoFocus
                 />
                 <motion.button
                   whileTap={{ scale: 0.9 }}
                   onClick={handleSaveUrl}
                   className="p-2 bg-m3-primary text-m3-on-primary rounded-xl"
                 >
                   <Check className="w-4 h-4" />
                 </motion.button>
               </div>
             )}
          </SettingsItem>
        </SettingsSection>

        <section className="mb-8 mt-10 px-2 flex justify-center">
            <motion.button 
              onClick={() => setShowResetModal(true)}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-red-500/30 text-red-500 font-semibold text-sm hover:bg-red-500/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </motion.button>
        </section>

        {/* About Section */}
        <section className="mb-8 mt-10 px-2">
          <GlassCard className="p-6 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-4 bg-orange-500/5 dark:bg-orange-500/10 rounded-[40px] blur-[40px] z-0 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-[40px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-m3-surface-variant/80 dark:bg-m3-surface-variant/50 backdrop-blur-md rounded-full shadow-sm border border-m3-outline/5 text-[10px] font-bold uppercase tracking-widest text-[#FF7043] dark:text-[#FFB74D]">
                <span>FOSS • Free Forever</span>
              </div>

              <h2 className="text-2xl font-display font-bold text-m3-on-surface">
                About Remotify
              </h2>

              <div className="space-y-4 text-sm font-medium text-m3-on-surface-variant/90 max-w-[280px] mx-auto leading-relaxed">
                <p>
                  Built by <span className="text-m3-primary">heyypramod</span>.<br />
                  I sometimes do code.
                </p>
                <p>
                  Remotify is a free and open-source remote experience built for Android TV and Google TV.
                </p>
                <p>
                  This app will always stay free.<br />
                  More updates and improvements are coming soon.
                </p>
              </div>

              {/* Inactive Placeholders */}
              <div className="flex gap-4 pt-2">
                <button 
                  className="w-10 h-10 rounded-full bg-m3-surface-variant/50 flex items-center justify-center text-m3-on-surface-variant hover:text-m3-on-surface transition-colors border border-m3-outline/5 cursor-not-allowed opacity-70"
                  aria-label="GitHub - Heyypramod"
                >
                  <Github className="w-5 h-5" />
                </button>
                <button 
                  className="w-10 h-10 rounded-full bg-m3-surface-variant/50 flex items-center justify-center text-m3-on-surface-variant hover:text-m3-on-surface transition-colors border border-m3-outline/5 cursor-not-allowed opacity-70"
                  aria-label="Website - Coming Soon"
                >
                  <Globe className="w-5 h-5" />
                </button>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Support Section */}
        <section className="mb-10 px-2">
          <div className="text-center mb-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-m3-on-surface-variant/80 drop-shadow-sm">
              Support the Project
            </h3>
            <p className="text-xs font-medium text-m3-on-surface-variant mt-2 max-w-[260px] mx-auto leading-relaxed">
              If you enjoy Remotify and want to support future development, you can buy me a coffee or donate via PayPal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="https://buymeacoffee.com/heyypramod" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-950 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-200 border border-orange-200/50 dark:border-orange-500/20 shadow-sm transition-all active:scale-[0.98]"
            >
              <Coffee className="w-4 h-4" />
              <span className="font-semibold text-sm">Buy Me a Coffee</span>
            </a>
            <a 
              href="https://paypal.me/heyypramod" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#00457C]/10 hover:bg-[#00457C]/20 text-[#00457C] dark:bg-[#0079C1]/20 dark:hover:bg-[#0079C1]/30 dark:text-[#0079C1] border border-[#00457C]/10 dark:border-[#0079C1]/20 shadow-sm transition-all active:scale-[0.98]"
            >
              <Heart className="w-4 h-4" />
              <span className="font-semibold text-sm">PayPal</span>
            </a>
          </div>
        </section>
      </motion.div>

      {/* Reset Modal Overlay */}
      <AnimatePresence>
        {showResetModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="fixed inset-0 bg-m3-surface/60 backdrop-blur-sm z-[100]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] bg-m3-elevated dark:bg-m3-surface-variant p-6 rounded-[28px] shadow-xl z-[101] border border-m3-outline/20"
            >
              <h3 className="text-xl font-display font-bold text-m3-on-surface mb-2">Reset Settings?</h3>
              <p className="text-sm font-medium text-m3-on-surface-variant mb-6 leading-relaxed">
                This will restore all preferences back to their original defaults. Are you sure?
              </p>
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 rounded-full font-semibold text-sm text-m3-on-surface hover:bg-m3-surface-variant transition-colors border border-m3-outline/10"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-full font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
