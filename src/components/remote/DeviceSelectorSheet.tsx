import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Tv, MonitorSpeaker, Speaker, Wifi, Check, RefreshCw } from "lucide-react";
import { useRemote } from "../../context/RemoteContext";

interface DeviceSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceSelectorSheet({ isOpen, onClose }: DeviceSelectorSheetProps) {
  const { devices, selectedDevice, selectDevice, listDevices } = useRemote();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Initial fetch
      setIsLoading(true);
      listDevices();
      setTimeout(() => setIsLoading(false), 800);

      // Auto refresh every 10 seconds
      const interval = setInterval(() => {
        listDevices();
      }, 10000);

      return () => {
        document.body.style.overflow = 'unset';
        clearInterval(interval);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, listDevices]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "tv": return <Tv className="w-5 h-5" />;
      case "display": return <MonitorSpeaker className="w-5 h-5" />;
      case "speaker": return <Speaker className="w-5 h-5" />;
      default: return <Tv className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="absolute bottom-0 left-0 right-0 z-[70] bg-m3-surface/90 backdrop-blur-3xl rounded-t-[40px] shadow-[0_-8px_32px_rgba(0,0,0,0.08)] p-6 pb-12 max-w-md mx-auto border-t border-m3-outline/10 h-auto min-h-[50vh]"
          >
            {/* Drag Handle */}
            <div className="w-16 h-1.5 bg-m3-surface-variant rounded-full mx-auto mb-6" />

            <div className="text-center mb-8 relative">
              <h2 className="text-xl font-display font-semibold text-m3-on-surface mb-2">
                Available Devices
              </h2>
              <div className="flex items-center justify-center gap-2 text-m3-primary text-sm font-medium">
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning local network...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>ADB Network Scan Active</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3 p-1">
              {isLoading && devices.length === 0 ? (
                <>
                  {[1, 2].map((i) => (
                    <div key={i} className="w-full p-4 rounded-[32px] flex items-center gap-4 bg-m3-surface-variant/40 animate-pulse">
                      <div className="w-12 h-12 rounded-[18px] bg-m3-surface-variant" />
                      <div className="flex-1 space-y-2">
                        <div className="w-32 h-4 bg-m3-surface-variant rounded" />
                        <div className="w-20 h-3 bg-m3-surface-variant rounded" />
                      </div>
                    </div>
                  ))}
                </>
              ) : devices.length > 0 ? (
                devices.map((device, i) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => {
                      selectDevice(device.id);
                      onClose();
                    }}
                    className={`relative w-full p-4 rounded-[32px] flex items-center gap-4 cursor-pointer transition-all border overflow-hidden ${
                      selectedDevice?.id === device.id 
                        ? "bg-m3-primary-container border-m3-primary/30 text-m3-on-primary-container shadow-[0_0_20px_rgba(255,179,106,0.15)]" 
                        : "bg-m3-surface-variant/40 border-m3-outline/5 hover:bg-m3-surface-variant/60"
                    }`}
                  >
                    {selectedDevice?.id === device.id && (
                      <div className="absolute inset-0 bg-m3-primary/5 pointer-events-none" />
                    )}
                    <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center relative z-10 ${selectedDevice?.id === device.id ? "bg-m3-primary text-m3-on-primary shadow-sm" : "bg-m3-surface-variant text-m3-primary"}`}>
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="flex-1 text-left relative z-10 min-w-0">
                      <h3 className="font-semibold text-base truncate pr-2">{device.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${device.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <p className="text-xs opacity-80">{device.isConnected ? "Connected" : "Offline"}</p>
                        <span className="text-[10px] opacity-40 ml-1 truncate">{device.id}</span>
                      </div>
                    </div>
                    {selectedDevice?.id === device.id && (
                      <div className="w-7 h-7 rounded-full bg-m3-primary/20 flex items-center justify-center relative z-10 shrink-0">
                        <Check className="w-4 h-4 text-m3-primary" />
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-16 h-16 bg-m3-surface-variant rounded-full flex items-center justify-center mb-4 text-m3-on-surface-variant">
                    <Tv className="w-8 h-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-semibold text-m3-on-surface mb-1">No Android TV devices found</h3>
                  <p className="text-sm text-m3-on-surface-variant mb-6 leading-relaxed max-w-[250px]">
                    Make sure ADB debugging is enabled on your TV and it's on the same network.
                  </p>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsLoading(true);
                      listDevices();
                      setTimeout(() => setIsLoading(false), 800);
                    }}
                    className="px-6 py-2.5 bg-m3-primary text-m3-on-primary rounded-full font-semibold text-sm shadow-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Scan
                  </motion.button>
                </motion.div>
              )}
            </div>
            
            <div className="mt-6 flex justify-center">
               <motion.button onClick={onClose} whileTap={{ scale: 0.95 }} className="px-6 py-2 bg-m3-surface-variant/50 rounded-[14px] text-m3-on-surface font-medium text-sm">
                 Cancel
               </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
