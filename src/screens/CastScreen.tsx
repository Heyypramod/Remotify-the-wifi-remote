import { motion } from "motion/react";
import {
  Cast,
  Tv,
  MonitorSpeaker,
  Speaker,
  MoreVertical,
  Wifi,
  Activity,
  RefreshCw,
  Signal,
  WifiOff
} from "lucide-react";
import { useRemote } from "../context/RemoteContext";
import { ConnectionState } from "../types/remote";
import { useEffect, useState, useMemo, memo, useCallback } from "react";

const getDeviceIcon = (type: string, className: string = "w-6 h-6") => {
  const t = type.toLowerCase();
  if (t.includes('tv')) return <Tv className={className} />;
  if (t.includes('display') || t.includes('monitor')) return <MonitorSpeaker className={className} />;
  if (t.includes('speaker') || t.includes('audio')) return <Speaker className={className} />;
  return <Cast className={className} />;
};

const DeviceItem = memo(({ device, onSelect, index }: { device: any, onSelect: (id: string) => void, index: number }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.1, type: "spring", stiffness: 400, damping: 17 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onSelect(device.id)}
      className="bg-m3-surface/50 dark:bg-[#1E1E20]/50 hover:bg-m3-surface-variant dark:hover:bg-[#2A2A2E] rounded-[24px] p-4 border border-m3-outline/10 shadow-sm flex items-center gap-4 cursor-pointer group transition-all backdrop-blur-sm"
      role="button"
      tabIndex={0}
      aria-label={`Connect to ${device.name}`}
    >
      <div className={`w-14 h-14 bg-m3-surface-variant/50 rounded-[20px] flex items-center justify-center transition-colors relative shadow-sm border border-m3-outline/5 ${device.isConnected ? 'text-m3-primary group-hover:bg-m3-primary/10' : 'text-m3-on-surface-variant'}`}>
        {getDeviceIcon(device.type, "w-6 h-6")}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-m3-on-surface truncate text-base group-hover:text-m3-primary transition-colors">
          {device.name}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-m3-on-surface-variant font-medium mt-0.5">
          {device.isConnected && (
            <Signal className="w-3.5 h-3.5 text-m3-primary animate-pulse" />
          )}
          <span className={`w-1.5 h-1.5 rounded-full ${device.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <p className="truncate">{device.isConnected ? 'Available' : 'Offline'}</p>
        </div>
      </div>
    </motion.div>
  );
});

export function CastScreen() {
  const { devices, selectedDevice, selectDevice, listDevices, connectionState, reconnect } = useRemote();
  const [isScanning, setIsScanning] = useState(false);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isDeviceReady = isConnected && selectedDevice?.isConnected;

  useEffect(() => {
    if (isConnected) {
      setIsScanning(true);
      listDevices();
      const t = setTimeout(() => setIsScanning(false), 1500);
      
      const intervalId = setInterval(() => {
        listDevices();
      }, 15000);

      return () => {
        clearTimeout(t);
        clearInterval(intervalId);
      };
    }
  }, [isConnected, listDevices]);

  const handleRefresh = useCallback(() => {
    if (!isConnected) {
      reconnect();
      return;
    }
    setIsScanning(true);
    listDevices();
    setTimeout(() => setIsScanning(false), 1500);
  }, [isConnected, reconnect, listDevices]);

  // Filter out the selected device from the available list
  const availableDevices = useMemo(() => {
    return devices.filter(d => d.id !== selectedDevice?.id);
  }, [devices, selectedDevice]);

  const handleSelectDevice = useCallback((id: string) => {
    selectDevice(id);
  }, [selectDevice]);

  return (
    <div className="space-y-8 pb-20" id="cast-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-m3-on-surface tracking-tight">
            Cast
          </h2>
          <p className="text-m3-on-surface-variant font-medium text-sm flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? "Connected to Network" : "App Offline"}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleRefresh}
          className="w-10 h-10 rounded-full bg-m3-surface-variant/50 flex items-center justify-center text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-primary/10 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${isScanning ? 'animate-spin text-m3-primary' : ''}`} />
        </motion.button>
      </div>

      {/* Connected Device Card */}
      {selectedDevice && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute -inset-4 bg-m3-primary/20 rounded-[40px] blur-[40px] z-0 pointer-events-none animate-ambient-pulse mix-blend-screen" />

          {/* Card */}
          <div className="relative z-10 bg-gradient-to-b from-m3-surface-variant/90 to-m3-surface-variant/40 dark:from-m3-surface-variant/40 dark:to-[#111113]/80 backdrop-blur-3xl rounded-[40px] p-8 mt-2 border border-m3-outline/20 dark:border-white/5 shadow-[0_24px_48px_rgba(36,31,26,0.08),inset_0_2px_16px_rgba(255,255,255,0.4)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_2px_16px_rgba(255,255,255,0.05)] flex flex-col items-center text-center overflow-hidden">
              {/* Ambient Lighting Layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-m3-primary/10 dark:from-white/5 to-transparent opacity-80 pointer-events-none" />
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-m3-primary/10 rounded-full blur-[80px] animate-ambient-shift pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-m3-primary/5 rounded-full blur-[80px] animate-ambient-shift pointer-events-none" style={{ animationDelay: '-10s' }} />
              
              {/* Edge Reflection */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-m3-primary/40 dark:via-white/10 to-transparent pointer-events-none" />
              
              {/* Glowing Icon */}
              <div className="relative mb-6 z-10 group cursor-pointer flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.4, 0.15] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-0 ${isDeviceReady ? 'bg-m3-primary-glow' : 'bg-red-500/30'} rounded-full blur-2xl`}
                />
                <div className={`relative w-[100px] h-[100px] flex items-center justify-center ${isDeviceReady ? 'text-m3-primary' : 'text-m3-on-surface-variant'} transition-transform duration-500`}>
                  <motion.svg 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    viewBox="0 0 100 100" 
                    className="absolute inset-0 w-full h-full text-m3-surface-variant/80 dark:text-m3-surface-variant/30 drop-shadow-sm"
                  >
                    <path fill="currentColor" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" d={(() => {
                      let d = "";
                      for (let i = 0; i <= 360; i += 2) {
                        const angle = (i * Math.PI) / 180;
                        const radius = 43 + 5 * Math.cos(9 * angle);
                        const x = 50 + radius * Math.cos(angle);
                        const y = 50 + radius * Math.sin(angle);
                        if (i === 0) d += `M ${x} ${y} `;
                        else d += `L ${x} ${y} `;
                      }
                      return d + "Z";
                    })()} />
                  </motion.svg>
                  <div className="relative z-10 flex items-center justify-center w-full h-full">
                    {getDeviceIcon(selectedDevice.type, "w-10 h-10")}
                  </div>
                </div>
              </div>

              <div className="space-y-2 z-10">
                <div className="flex items-center justify-center gap-2 text-m3-on-surface">
                  {isDeviceReady ? (
                    <Wifi className="w-5 h-5 text-m3-primary" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className="text-2xl font-display font-semibold">
                    {selectedDevice.name}
                  </h3>
                </div>
                <p className="text-m3-on-surface-variant font-medium text-sm">
                  {selectedDevice.ipAddress || selectedDevice.id.split(':')[0]} • {isDeviceReady ? 'Connected' : 'Offline'}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => selectDevice("")}
                className="mt-8 px-6 py-2.5 bg-m3-surface/80 dark:bg-m3-surface-variant/60 backdrop-blur-md text-m3-on-surface border border-m3-outline/20 dark:border-white/10 font-semibold tracking-wide rounded-full shadow-sm hover:border-red-500/50 hover:text-red-500 focus:ring-2 ring-red-500/20 transition-all text-sm z-10"
              >
                Disconnect
              </motion.button>
          </div>
        </motion.div>
      )}

      {/* Available Devices List */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-display font-semibold text-m3-on-surface flex items-center gap-2">
            Available Devices
            {isScanning && <span className="flex w-2 h-2 rounded-full bg-m3-primary animate-pulse" />}
          </h3>
        </div>

        <div className="space-y-3">
          {isScanning && devices.length === 0 ? (
            // Loading Skeletons
            [1, 2].map((i) => (
              <div key={i} className="bg-m3-surface-variant/30 rounded-[24px] p-4 border border-m3-outline/5 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 bg-m3-surface-variant rounded-[20px]" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-m3-surface-variant rounded" />
                  <div className="w-20 h-3 bg-m3-surface-variant rounded" />
                </div>
              </div>
            ))
          ) : availableDevices.length > 0 ? (
            availableDevices.map((device, i) => (
              <DeviceItem key={device.id} device={device} onSelect={handleSelectDevice} index={i} />
            ))
          ) : (
            // Empty State
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center p-10 text-center bg-m3-surface-variant/30 rounded-[32px] border border-m3-outline/5"
            >
              <div className="w-16 h-16 bg-m3-surface-variant/50 rounded-full flex items-center justify-center mb-4 text-m3-on-surface-variant">
                <Tv className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-m3-on-surface mb-1">No cast devices found</h3>
              <p className="text-sm text-m3-on-surface-variant mb-6 leading-relaxed max-w-[250px]">
                Make sure your TV and phone are connected to the same network.
              </p>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="px-6 py-2.5 bg-m3-primary/10 text-m3-primary hover:bg-m3-primary/20 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Scan
              </motion.button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
