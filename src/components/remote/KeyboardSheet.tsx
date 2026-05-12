import { motion, AnimatePresence } from "motion/react";
import { X, Delete, Globe, Mic, Search, ArrowUp, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRemote } from "../../context/RemoteContext";
import { RemoteCommandType, RemoteKey, ConnectionState } from "../../types/remote";
import { useHaptics } from "../../hooks/useHaptics";

interface KeyboardSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardSheet({ isOpen, onClose }: KeyboardSheetProps) {
  const { dispatch, connectionState } = useRemote();
  const { vibrate } = useHaptics();
  const isConnected = connectionState === ConnectionState.CONNECTED;

  const [inputText, setInputText] = useState("");
  const [isCaps, setIsCaps] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const deleteIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const keys = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"]
  ];

  // Clear text when closed
  useEffect(() => {
    if (!isOpen) {
      setInputText("");
      setSendStatus('idle');
      setIsCaps(false);
    }
  }, [isOpen]);

  const handleKeyPress = (key: string) => {
    if (!isConnected || sendStatus === 'sending') return;
    setInputText((prev) => prev + (isCaps ? key.toUpperCase() : key));
    vibrate(5);
  };

  const handleSpace = () => {
    if (!isConnected || sendStatus === 'sending') return;
    setInputText((prev) => prev + " ");
    vibrate(5);
  };

  const handleDelete = () => {
    if (!isConnected || sendStatus === 'sending') return;
    setInputText((prev) => prev.slice(0, -1));
    vibrate(5);
  };

  const startDeleteRepeat = () => {
    handleDelete();
    if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
    deleteIntervalRef.current = setInterval(handleDelete, 100);
  };

  const stopDeleteRepeat = () => {
    if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
    deleteIntervalRef.current = null;
  };

  const handleSend = async () => {
    if (!isConnected || inputText.length === 0 || sendStatus === 'sending') return;
    
    setSendStatus('sending');
    console.log('[REMOTE] Sending text input');
    vibrate(10);
    
    try {
      await dispatch({ type: RemoteCommandType.TEXT, payload: { text: inputText } });
      await dispatch({ type: RemoteCommandType.KEY, payload: { key: RemoteKey.ENTER } });
      console.log('[SUCCESS] Text sent successfully');
      
      setSendStatus('success');
      vibrate([10, 30, 20]);
      setTimeout(() => {
        setInputText("");
        setSendStatus('idle');
      }, 800);
    } catch (err) {
      console.error('[REMOTE] Error sending text', err);
      setSendStatus('error');
      vibrate([30, 50, 30]);
      setTimeout(() => setSendStatus('idle'), 1500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-m3-surface/30 z-[60] backdrop-blur-md"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 200, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className={`absolute bottom-0 left-0 right-0 z-[70] bg-m3-elevated/95 dark:bg-m3-surface-variant/40 backdrop-blur-3xl rounded-t-[40px] shadow-[0_-16px_40px_rgba(36,31,26,0.06)] dark:shadow-[0_-16px_64px_rgba(0,0,0,0.6),inset_0_2px_16px_rgba(255,255,255,0.03)] p-6 pb-12 max-w-md mx-auto h-auto min-h-[50vh] border-t border-m3-outline/20 dark:border-white/5 overflow-hidden ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {/* Ambient Background Lighting */}
            <div className="absolute inset-0 bg-gradient-to-t from-m3-surface/50 dark:from-m3-surface to-transparent pointer-events-none opacity-80" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-m3-primary/5 rounded-full blur-[60px] animate-ambient-shift pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />

            {/* Content Container (z-10 to stay above ambient layers) */}
            <div className="relative z-10">
              {/* Drag Handle */}
              <div className="w-16 h-1.5 bg-m3-outline/30 rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h3 className="text-xl font-display font-semibold text-m3-on-surface">Keyboard</h3>
                <p className="text-sm text-m3-on-surface-variant font-medium">Type to search on TV</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-3 bg-m3-surface-variant/50 rounded-[14px] hover:bg-m3-surface-variant transition-colors"
              >
                <X className="w-5 h-5 text-m3-on-surface-variant" />
              </motion.button>
            </div>

            {/* Input Preview Area */}
            <div className={`mb-8 p-4 bg-m3-surface-variant/40 rounded-[28px] border border-m3-outline/10 flex items-center gap-3 shadow-inner ${sendStatus === 'error' ? 'border-red-500/50 bg-red-500/10' : ''}`}>
              <Search className="w-5 h-5 text-m3-primary" />
              <div className="h-6 w-full flex items-center text-m3-on-surface-variant overflow-hidden">
                {inputText.length > 0 ? (
                  <span className="font-medium tracking-wide text-m3-on-surface truncate">{inputText}</span>
                ) : (
                  <span className="font-medium tracking-wide opacity-50">Search for movies, apps...</span>
                )}
                <motion.div 
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-0.5 h-full bg-m3-primary ml-1 shrink-0"
                />
              </div>
            </div>

            {/* Simulated Keyboard Layout */}
            <div className="space-y-2.5">
              {keys.map((row, i) => (
                <div key={i} className="flex justify-center gap-2">
                  {i === 2 && (
                    <motion.button
                      whileTap={{ scale: 0.85, y: 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => { setIsCaps(!isCaps); vibrate(5); }}
                      className={`flex-1 max-w-[42px] h-12 rounded-[12px] text-m3-on-surface flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] border-b-[3px] border-m3-outline/10 active:border-b-0 active:mt-[3px] active:mb-[-3px] ${isCaps ? 'bg-m3-primary/20 text-m3-primary' : 'bg-m3-surface-variant/70'}`}
                    >
                      <ArrowUp className={`w-5 h-5 ${isCaps ? '' : 'opacity-70'}`} />
                    </motion.button>
                  )}
                  {row.map((key) => (
                    <motion.button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      whileTap={{ scale: 0.85, y: 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="flex-1 max-w-[42px] h-12 bg-m3-surface-variant/70 rounded-[12px] text-m3-on-surface font-medium uppercase text-base hover:bg-m3-surface-variant transition-colors flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] border-b-[3px] border-m3-outline/10 active:border-b-0 active:mt-[3px] active:mb-[-3px] select-none"
                    >
                      {isCaps ? key.toUpperCase() : key}
                    </motion.button>
                  ))}
                  {i === 2 && (
                    <motion.button
                      onPointerDown={startDeleteRepeat}
                      onPointerUp={stopDeleteRepeat}
                      onPointerCancel={stopDeleteRepeat}
                      onPointerLeave={stopDeleteRepeat}
                      whileTap={{ scale: 0.85, y: 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="flex-1 max-w-[42px] h-12 bg-m3-surface-variant/90 text-m3-on-surface rounded-[12px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] border-b-[3px] border-m3-outline/10 active:border-b-0 active:mt-[3px] active:mb-[-3px] touch-none select-none"
                    >
                      <Delete className="w-5 h-5 opacity-70 pointer-events-none" />
                    </motion.button>
                  )}
                </div>
              ))}

              {/* Bottom row special keys */}
              <div className="flex justify-center gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.85, y: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex-[1.5] h-12 bg-m3-surface-variant/70 rounded-[12px] text-m3-on-surface flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] border-b-[3px] border-m3-outline/10 active:border-b-0 active:mt-[3px] active:mb-[-3px]"
                >
                  <Globe className="w-5 h-5 opacity-70" />
                </motion.button>
                <motion.button
                  onClick={handleSpace}
                  whileTap={{ scale: 0.9, y: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex-[6] h-12 bg-m3-surface-variant/70 rounded-[12px] text-m3-on-surface text-sm uppercase tracking-wider font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.1)] border-b-[3px] border-m3-outline/10 active:border-b-0 active:mt-[3px] active:mb-[-3px] select-none"
                >
                  Space
                </motion.button>
              </div>
            </div>

            {/* Bottom Suggestions/Actions */}
            <div className="mt-8 flex items-center justify-between">
               <motion.button whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-4 py-2 bg-m3-surface-variant/30 rounded-[16px] text-m3-on-surface-variant hover:text-m3-primary transition-colors font-medium text-sm">
                 <Mic className="w-4 h-4" />
                 Voice Search
               </motion.button>
               <motion.button 
                 onClick={handleSend}
                 disabled={inputText.length === 0 || sendStatus === 'sending'}
                 whileTap={{ scale: 0.95 }} 
                 className={`px-8 py-3 rounded-[20px] font-bold text-sm shadow-[0_4px_14px_rgba(255,179,106,0.15)] transition-colors flex items-center gap-2 ${
                   inputText.length === 0 ? 'bg-m3-surface-variant text-m3-on-surface opacity-50' :
                   sendStatus === 'success' ? 'bg-green-500 text-white' :
                   sendStatus === 'error' ? 'bg-red-500 text-white' :
                   'bg-m3-primary text-m3-on-primary hover:bg-m3-primary/90'
                 }`}
               >
                 {sendStatus === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                 {sendStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                 {sendStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                 {sendStatus === 'idle' && 'ENTER'}
                 {sendStatus === 'sending' && 'SENDING'}
                 {sendStatus === 'success' && 'SENT'}
                 {sendStatus === 'error' && 'FAILED'}
               </motion.button>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
