import React, { useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { MousePointer2 } from "lucide-react";
import { useRemote } from "../../context/RemoteContext";
import { RemoteCommandType, RemoteKey } from "../../types/remote";

export function Touchpad() {
  const { dispatch } = useRemote();
  
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearLongPress();
  }, [clearLongPress]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDownRef.current = true;
    hasMovedRef.current = false;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: e.clientX, y: e.clientY };

    dispatch({
      type: RemoteCommandType.POINTER,
      payload: { deltaX: 0, deltaY: 0, direction: "DOWN" }
    });

    // Start long press detection
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      if (!hasMovedRef.current && isDownRef.current) {
        // Trigger Long Press
        // Assuming DPAD_CENTER long press brings up contextual menus on Android TV
        dispatch({
          type: RemoteCommandType.KEY,
          payload: { key: RemoteKey.ENTER } // Ideally needs a LONG_PRESS variant, using ENTER
        });
        
        // When finger lifts, we need to send UP
      }
    }, 500);

  }, [dispatch, clearLongPress]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDownRef.current || !lastPosRef.current) return;

    const deltaX = e.clientX - lastPosRef.current.x;
    const deltaY = e.clientY - lastPosRef.current.y;
    
    const moveDistSq = Math.pow(e.clientX - (startPosRef.current?.x || 0), 2) + Math.pow(e.clientY - (startPosRef.current?.y || 0), 2);
    if (moveDistSq > 25) { // roughly 5px movement threshold
      hasMovedRef.current = true;
      clearLongPress();
    }

    if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      dispatch({
        type: RemoteCommandType.POINTER,
        payload: { deltaX, deltaY, direction: "MOVE" }
      });
    }
  }, [dispatch, clearLongPress]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDownRef.current) {
      const wasLongPress = longPressTimerRef.current === null && !hasMovedRef.current;
      clearLongPress();
      
      isDownRef.current = false;
      lastPosRef.current = null;
      
      dispatch({
        type: RemoteCommandType.POINTER,
        payload: { deltaX: 0, deltaY: 0, direction: "UP" }
      });

      if (!hasMovedRef.current) {
        if (!wasLongPress) {
          // It was a short tap
          dispatch({
            type: RemoteCommandType.KEY,
            payload: { key: RemoteKey.ENTER }
          });
        }
      }
    }
  }, [dispatch, clearLongPress]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full aspect-square relative rounded-[48px] flex flex-col items-center justify-center overflow-hidden group cursor-crosshair shadow-[inset_0_2px_40px_rgba(255,155,84,0.03),0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_40px_rgba(255,155,84,0.03),0_8px_32px_rgba(0,0,0,0.2)] bg-m3-surface-variant/40 touch-none"
      id="remote-touchpad"
      whileTap={{ scale: 0.98 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF9]/60 to-[#FFF6EC]/30 isolate pointer-events-none" />

      {/* Slow rotating conic glow */}
      <div 
        className="absolute w-[200%] h-[200%] opacity-20 pointer-events-none animate-conic-spin"
        style={{
          background: "conic-gradient(from 180deg at 50% 50%, transparent 0deg, var(--color-m3-primary-glow) 180deg, transparent 360deg)",
          filter: "blur(60px)"
        }}
      />
      
      {/* Ambient Pulse Core */}
      <div className="absolute w-64 h-64 bg-m3-primary/10 rounded-full blur-[80px] animate-ambient-pulse pointer-events-none dark:mix-blend-screen" />

      {/* Edge Reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
      
      {/* Interactive Glow Element (shows more on hover/active) */}
      <div className="absolute inset-0 bg-m3-primary/5 opacity-0 group-hover:opacity-100 group-active:bg-m3-primary/15 transition-all duration-700 ease-out pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <MousePointer2 className="w-8 h-8 text-m3-on-surface-variant/40 mb-3 group-active:scale-95 group-active:text-m3-primary/80 transition-all duration-500" />
        <span className="text-xs font-medium text-m3-on-surface-variant/40 uppercase tracking-widest group-hover:text-m3-on-surface-variant/70 transition-colors duration-500">
          Interaction Surface
        </span>
      </div>
    </motion.div>
  );
}
