import { motion, AnimatePresence } from "motion/react";
import React, { useRef, useState, useCallback } from "react";
import { useRemote } from "../../context/RemoteContext";
import { RemoteCommandType, RemoteKey, ConnectionState } from "../../types/remote";
import { useHaptics } from "../../hooks/useHaptics";

interface TouchSurfaceProps {
  children?: React.ReactNode;
  onInteraction?: () => void;
  label?: string;
  className?: string;
}

interface GestureState {
  isActive: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
  lastDispatchTime: number;
  hasSwiped: boolean;
}

export function TouchSurface({ children, onInteraction, label = "TOUCHPAD", className = "" }: TouchSurfaceProps) {
  const { dispatch, connectionState } = useRemote();
  const { vibrate } = useHaptics();
  const isConnected = connectionState === ConnectionState.CONNECTED;

  const glowRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; type: string }[]>([]);

  const gestureState = useRef<GestureState>({
    isActive: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    lastDispatchTime: 0,
    hasSwiped: false,
  });

  const SWIPE_THRESHOLD = 32;
  const TAP_THRESHOLD = 10;
  const THROTTLE_MS = 120;

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isConnected) return;
    if (onInteraction) onInteraction();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gestureState.current = {
      isActive: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      startTime: Date.now(),
      lastDispatchTime: 0,
      hasSwiped: false,
    };

    if (glowRef.current) {
      glowRef.current.style.opacity = '1';
      glowRef.current.style.transform = `translate(${x - 90}px, ${y - 90}px) scale(1)`;
    }
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isConnected, onInteraction]);

  const addRipple = useCallback((x: number, y: number, type: string) => {
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y, type }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!gestureState.current.isActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(${x - 90}px, ${y - 90}px) scale(1)`;
    }

    const state = gestureState.current;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;

    if (Math.abs(dx) >= SWIPE_THRESHOLD || Math.abs(dy) >= SWIPE_THRESHOLD) {
      state.hasSwiped = true;
      const now = Date.now();
      
      if (now - state.lastDispatchTime >= THROTTLE_MS) {
        let key: RemoteKey | null = null;
        if (Math.abs(dx) > Math.abs(dy)) {
          key = dx > 0 ? RemoteKey.DPAD_RIGHT : RemoteKey.DPAD_LEFT;
        } else {
          key = dy > 0 ? RemoteKey.DPAD_DOWN : RemoteKey.DPAD_UP;
        }

        if (key) {
          dispatch({ type: RemoteCommandType.KEY, payload: { key } });
          state.lastX = e.clientX;
          state.lastY = e.clientY;
          state.lastDispatchTime = now;
          
          vibrate(10);
          addRipple(x, y, 'swipe');
        }
      }
    }
  }, [dispatch, vibrate, addRipple]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (glowRef.current) {
      glowRef.current.style.opacity = '0';
      glowRef.current.style.transform = glowRef.current.style.transform.replace('scale(1)', 'scale(0.8)');
    }
    const state = gestureState.current;
    if (!state.isActive) return;
    
    state.isActive = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const totalDx = Math.abs(e.clientX - state.startX);
    const totalDy = Math.abs(e.clientY - state.startY);
    const duration = Date.now() - state.startTime;

    if (!state.hasSwiped && totalDx < TAP_THRESHOLD && totalDy < TAP_THRESHOLD && duration < 500) {
      dispatch({ type: RemoteCommandType.KEY, payload: { key: RemoteKey.ENTER } });
      vibrate(15);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addRipple(x, y, 'tap');
    }
  }, [dispatch, vibrate, addRipple]);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`relative w-full h-full bg-gradient-to-br from-m3-surface-variant/40 via-m3-surface/50 to-m3-surface-variant/60 dark:from-[#1C1C20] dark:via-[#1A1A1E] dark:to-[#16161A] rounded-[32px] sm:rounded-[40px] border border-m3-outline/20 dark:border-white/5 shadow-[inset_0_2px_8px_rgba(255,255,255,0.3),0_8px_24px_rgba(36,31,26,0.05)] dark:shadow-inner flex flex-col items-center justify-center overflow-hidden group cursor-crosshair touch-none select-none ${className} ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-m3-surface/20 to-transparent dark:from-white/0 dark:to-transparent pointer-events-none" />
      
      {isConnected && (
         <div
           ref={glowRef}
           className="absolute w-[180px] h-[180px] rounded-full blur-[40px] bg-m3-primary/20 pointer-events-none origin-center"
           style={{
             opacity: 0,
             transition: 'opacity 0.15s ease-out, transform 0.05s linear',
             top: 0,
             left: 0,
           }}
         />
      )}

      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: ripple.type === 'tap' ? 0.6 : 0.4 }}
            animate={{ scale: ripple.type === 'tap' ? 3 : 2, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`absolute rounded-full z-0 pointer-events-none ${
              ripple.type === 'tap' ? 'bg-m3-primary/30 w-16 h-16 -ml-8 -mt-8' : 'bg-m3-primary/20 w-12 h-12 -ml-6 -mt-6'
            }`}
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}
      </AnimatePresence>

      <div className="absolute top-5 left-6 z-20">
        <span className="text-[11px] font-bold tracking-[0.15em] text-[#7A6858] dark:text-[#A9B1C6] opacity-60 uppercase pointer-events-none">
          {label}
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pointer-events-none">
        {children}
      </div>
    </motion.div>
  );
}
