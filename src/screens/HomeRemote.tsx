import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { KeyboardSheet } from "../components/remote/KeyboardSheet";
import { DeviceSelectorSheet } from "../components/remote/DeviceSelectorSheet";
import { AnimatedIconButton } from "../components/ui/AnimatedIconButton";
import { TouchSurface } from "../components/ui/TouchSurface";
import { NumberPad } from "../components/remote/NumberPad";
import { SegmentedToggle } from "../components/ui/SegmentedToggle";
import { RemoteButton } from "../components/ui/RemoteButton";
import { Tv, MonitorSpeaker, Speaker, ChevronDown, Check, Keyboard, Power, MousePointer2, Hash, ArrowLeft, Home, Mic, Pause, Play, Plus, Minus } from "lucide-react";
import { useRemote } from "../context/RemoteContext";
import { RemoteCommandType, RemoteKey, ConnectionState } from "../types/remote";
import { useHaptics } from "../hooks/useHaptics";

export function HomeRemote() {
  const { devices, selectedDevice, selectDevice, dispatch, connectionState } = useRemote();
  const { vibrate } = useHaptics();
  
  const [mode, setMode] = useState<"touchpad" | "numpad">("touchpad");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState(false);
  const [backStatus, setBackStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isDeviceReady = isConnected && selectedDevice?.isConnected;

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDeviceSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDeviceIcon = useCallback((type: string, className?: string) => {
    const cls = className || "w-4 h-4";
    switch (type) {
      case "tv": return <Tv className={cls} />;
      case "display": return <MonitorSpeaker className={cls} />;
      case "speaker": return <Speaker className={cls} />;
      default: return <Tv className={cls} />;
    }
  }, []);

  const volIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [activeVolKey, setActiveVolKey] = useState<RemoteKey | null>(null);
  const [isListening, setIsListening] = useState(false);

  const startVolAction = useCallback((key: RemoteKey) => {
    if (!isDeviceReady) {
      showToast("No device connected");
      return;
    }
    if (volIntervalRef.current) clearInterval(volIntervalRef.current);
    
    setActiveVolKey(key);
    console.log(`[REMOTE] ${key} pressed`);
    dispatch({ type: RemoteCommandType.KEY, payload: { key } });
    vibrate(5);
    
    volIntervalRef.current = setInterval(() => {
      dispatch({ type: RemoteCommandType.KEY, payload: { key } });
      vibrate(5);
    }, 120);
  }, [isDeviceReady, showToast, dispatch, vibrate]);

  const stopVolAction = useCallback(() => {
    if (volIntervalRef.current) {
      clearInterval(volIntervalRef.current);
      volIntervalRef.current = null;
    }
    setActiveVolKey(null);
  }, []);

  const handleAction = useCallback(async (actionFn: () => Promise<void> | void) => {
    if (!isDeviceReady) {
      showToast("No device connected");
      return;
    }
    vibrate(10);
    try {
      await actionFn();
    } catch (err) {
      console.error('[REMOTE] Action failed', err);
    }
  }, [isDeviceReady, showToast, vibrate]);

  const handleBack = useCallback(async () => {
    if (!isDeviceReady) {
      showToast("No device connected");
      return;
    }
    console.log('[REMOTE] BACK pressed');
    setBackStatus('pending');
    vibrate(10);
    try {
      await dispatch({ type: RemoteCommandType.KEY, payload: { key: RemoteKey.BACK } });
      setBackStatus('success');
      vibrate([10, 30, 20]);
      setTimeout(() => setBackStatus('idle'), 500);
    } catch (err) {
      setBackStatus('error');
      console.error('[REMOTE] Error sending BACK command', err);
      vibrate([30, 50, 30]);
      setTimeout(() => setBackStatus('idle'), 1000);
    }
  }, [isDeviceReady, showToast, vibrate, dispatch]);

  const handleVoiceAction = useCallback(async () => {
    if (!isDeviceReady) {
      showToast("No device connected");
      return;
    }
    
    console.log('[REMOTE] VOICE_ASSIST triggered');
    setIsListening(true);
    vibrate(10);
    
    try {
      await dispatch({ type: RemoteCommandType.KEY, payload: { key: RemoteKey.VOICE_ASSIST } });
    } catch (err) {
      console.error('[REMOTE] Voice action failed', err);
    }
    
    setTimeout(() => {
      setIsListening(false);
    }, 1000);
  }, [isDeviceReady, showToast, vibrate, dispatch]);

  return (
    <div className="flex-1 flex flex-col justify-between gap-4 sm:gap-6" id="home-remote-screen">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[100] bg-m3-inverse-surface text-m3-inverse-on-surface px-4 py-2 rounded-full text-sm font-medium shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Device Header */}
      <div className={`flex shrink-0 items-center justify-between relative z-50 transition-opacity duration-300 ${!isConnected ? "opacity-90" : ""}`} ref={dropdownRef}>
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsDeviceSelectorOpen(!isDeviceSelectorOpen)}
            className={`relative overflow-hidden flex items-center justify-between gap-2 px-4 py-2 rounded-[24px] border transition-all duration-300 shadow-sm max-w-[180px] ${
              isConnected 
                ? "bg-m3-primary-container border-m3-primary/20 text-m3-on-primary-container" 
                : "bg-m3-surface-variant border-m3-outline/20 text-m3-on-surface-variant hover:bg-m3-surface-variant/80 dark:hover:bg-[#25252A] dark:bg-[#1A1A1E]"
            }`}
          >
            <div className="relative z-10 flex items-center gap-2.5 overflow-hidden">
              <span className={`shrink-0 w-5 h-5 flex items-center justify-center ${isDeviceReady ? "text-m3-primary" : "text-m3-on-surface-variant opacity-80"}`}>
                {selectedDevice ? getDeviceIcon(selectedDevice.type) : <Tv className="w-4 h-4" />}
              </span>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[14px] font-medium tracking-wide translate-y-px truncate w-full text-left leading-tight">
                  {selectedDevice ? selectedDevice.name : "Select Device"}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold opacity-80 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    !isConnected ? 'bg-red-500' :
                    (selectedDevice?.isConnected ? 'bg-green-500' : 'bg-red-500')
                  }`} />
                  {!isConnected ? 'App Offline' :
                   (selectedDevice?.isConnected ? 'Connected' : 'TV Offline')}
                </span>
              </div>
            </div>
            <motion.div 
              animate={{ rotate: isDeviceSelectorOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronDown className="w-4 h-4 opacity-50 relative z-10" />
            </motion.div>
          </motion.button>
          
          <DeviceSelectorSheet
            isOpen={isDeviceSelectorOpen}
            onClose={() => setIsDeviceSelectorOpen(false)}
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <AnimatedIconButton
            icon={<Keyboard className="w-5 h-5 text-m3-on-surface-variant" />}
            onClick={() => handleAction(() => setIsKeyboardOpen(true))}
            isActive={false}
            variant="surface"
          />
          <AnimatedIconButton
            icon={<Power className="w-5 h-5" />}
            onClick={() => handleAction(() => dispatch({ type: RemoteCommandType.KEY, payload: { key: RemoteKey.POWER } }))}
            isActive={false}
            variant="surface"
          />
        </div>
      </div>

      <KeyboardSheet
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
      />

      {/* Main Control Area */}
      <div className={`flex-1 flex flex-col justify-between px-1 relative transition-opacity duration-300 ${!isDeviceReady ? "opacity-70 grayscale-[0.3] pointer-events-none" : ""}`}>
          <SegmentedToggle
          value={mode}
          onChange={setMode}
          className="my-2 sm:my-4 shrink-0 max-w-[320px] mx-auto w-full"
          options={[
            {
              id: "touchpad",
              label: "Touch Pad",
              icon: <MousePointer2 className="w-5 h-5" />,
            },
            {
              id: "numpad",
              label: "Number Pad",
              icon: <Hash className="w-4 h-4 mr-1" />,
            },
          ]}
        />

        <div className="flex w-full flex-1 shrink min-h-[220px] max-h-[35vh] lg:max-h-[380px] max-w-[400px] relative items-stretch justify-center mx-auto my-2 sm:my-4">
          <AnimatePresence mode="wait">
            {mode === "touchpad" ? (
              <motion.div
                key="touchpad"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full h-full"
              >
                <TouchSurface className="w-full h-full" />
              </motion.div>
            ) : (
              <motion.div
                key="numpad"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full h-full"
              >
                <NumberPad />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Control Actions & Volume Rocker */}
        <div className="flex shrink-0 justify-between items-stretch max-w-[320px] mx-auto w-full mt-6 sm:mt-10 mb-2">
          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 sm:gap-y-5 sm:gap-x-8 flex-1 py-1">
            <div className="flex justify-center">
              <RemoteButton
                icon={<ArrowLeft className="w-5 h-5" />}
                label="Back"
                onClick={handleBack}
                className={`!h-[56px] !rounded-[28px] shadow-none dark:bg-m3-surface-variant/30 ${backStatus === 'error' ? 'text-red-500' : ''}`}
                style={{ width: 84 }}
                whileTap={{ width: 56, scale: 0.9 }}
                variant="surface"
              />
            </div>
            <div className="flex justify-center">
              <RemoteButton
                icon={<Home className="w-5 h-5" />}
                label="Home"
                onClick={() => handleAction(() => {
                  console.log('[REMOTE] HOME pressed');
                  dispatch({ type: RemoteCommandType.KEY, payload: { key: RemoteKey.HOME } });
                })}
                className="!h-[56px] !rounded-[28px] shadow-none dark:bg-m3-surface-variant/30 text-m3-on-surface"
                style={{ width: 84 }}
                whileTap={{ width: 56, scale: 0.9 }}
                variant="surface"
              />
            </div>
            <div className="flex justify-center relative">
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-orange-500/20 blur-[20px] rounded-full z-0 pointer-events-none"
                />
              )}
              <RemoteButton
                icon={
                  <motion.div
                    animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                    transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
                  >
                    <Mic className={`w-5 h-5 ${isListening ? 'text-orange-500' : ''}`} />
                  </motion.div>
                }
                label={isListening ? "Listening..." : "Voice"}
                onClick={handleVoiceAction}
                className={`!h-[56px] !rounded-[28px] shadow-none relative z-10 transition-colors ${
                  isListening 
                    ? "bg-orange-500/10 text-orange-500" 
                    : "dark:bg-m3-surface-variant/30 text-m3-on-surface"
                }`}
                style={{ width: 84 }}
                whileTap={{ width: 56, scale: 0.9 }}
                variant="surface"
              />
            </div>
            <div className="flex justify-center">
              <RemoteButton
                icon={<Play className="w-5 h-5 ml-1" />}
                label="Play/Pause"
                onClick={() => handleAction(() => dispatch({ type: RemoteCommandType.KEY, payload: { key: RemoteKey.PLAY_PAUSE } }))}
                className="!h-[56px] !rounded-[28px] shadow-none dark:bg-m3-surface-variant/30 text-m3-on-surface"
                style={{ width: 84 }}
                whileTap={{ width: 56, scale: 0.9 }}
                variant="surface"
              />
            </div>
          </div>

          {/* Volume Rocker */}
          <div className={`w-14 ml-8 flex flex-col justify-between items-center py-2 bg-m3-surface-variant/70 dark:bg-m3-surface-variant/30 text-m3-on-surface rounded-full shadow-[0_8px_24px_rgba(36,31,26,0.06),inset_0_2px_4px_rgba(255,255,255,0.4)] border border-m3-outline/10 dark:border-white/5 ring-1 ring-m3-outline/20 dark:ring-0`}>
            <motion.button 
              whileTap={{ scale: 0.9, backgroundColor: "rgba(36,31,26,0.04)" }}
              className={`relative p-3 hover:bg-m3-outline/10 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center opacity-80 overflow-hidden touch-none select-none ${activeVolKey === RemoteKey.VOLUME_UP ? 'bg-m3-outline/10 dark:bg-white/5 text-m3-primary' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); startVolAction(RemoteKey.VOLUME_UP); }}
              onPointerUp={(e) => { e.preventDefault(); stopVolAction(); }}
              onPointerLeave={(e) => { e.preventDefault(); stopVolAction(); }}
              onPointerCancel={(e) => { e.preventDefault(); stopVolAction(); }}
            >
              <Plus className="w-5 h-5 relative z-10" />
            </motion.button>
            <div className="flex flex-col items-center justify-center font-medium opacity-60 py-1">
              <span className="text-[10px] font-bold tracking-[0.1em] mb-1 pointer-events-none select-none">VOL</span>
            </div>
            <motion.button 
              whileTap={{ scale: 0.9, backgroundColor: "rgba(36,31,26,0.04)" }}
              className={`relative p-3 hover:bg-m3-outline/10 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center opacity-80 overflow-hidden touch-none select-none ${activeVolKey === RemoteKey.VOLUME_DOWN ? 'bg-m3-outline/10 dark:bg-white/5 text-m3-primary' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); startVolAction(RemoteKey.VOLUME_DOWN); }}
              onPointerUp={(e) => { e.preventDefault(); stopVolAction(); }}
              onPointerLeave={(e) => { e.preventDefault(); stopVolAction(); }}
              onPointerCancel={(e) => { e.preventDefault(); stopVolAction(); }}
            >
              <Minus className="w-5 h-5 relative z-10" />
            </motion.button>
          </div>
        </div>
      </div>

    </div>
  );
}
