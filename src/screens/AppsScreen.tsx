import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Tv, RefreshCw, AlertCircle } from "lucide-react";
import { useRemote } from "../context/RemoteContext";
import { ConnectionState } from "../types/remote";
import { useHaptics } from "../hooks/useHaptics";

import { memo } from "react";
// ... other imports

const getAppColor = (packageName: string) => {
  const colors = [
    "bg-red-600 text-white",
    "bg-blue-600 text-white",
    "bg-green-600 text-white",
    "bg-m3-primary text-m3-on-primary",
    "bg-yellow-600 text-white",
    "bg-purple-600 text-white",
    "bg-pink-600 text-white",
    "bg-indigo-600 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < packageName.length; i++) {
      hash = packageName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
};

const AppItem = memo(({ app, onLaunch }: { app: any, onLaunch: (pkg: string) => void }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => onLaunch(app.packageName)}
      className="flex flex-col items-center gap-2.5 cursor-pointer group relative"
      role="button"
      tabIndex={0}
      aria-label={`Launch ${app.name}`}
    >
      <div
        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] ${getAppColor(app.packageName)} shadow-sm border ${app.isActive ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] ring-2 ring-orange-500/50' : 'border-m3-outline/10'} flex items-center justify-center text-3xl font-display font-semibold transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] group-hover:-translate-y-1.5 relative overflow-hidden`}
      >
        {app.isActive && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-50" />
        <span className="relative z-10 drop-shadow-md">{getInitials(app.name)}</span>
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
      </div>
      <span className="text-[13px] font-medium text-m3-on-surface-variant group-hover:text-m3-on-surface transition-colors truncate w-full text-center px-1">
        {app.name}
      </span>
    </motion.div>
  );
});

export function AppsScreen() {
  const { apps, getApps, launchApp, connectionState, selectedDevice } = useRemote();
  const { vibrate } = useHaptics();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isDeviceReady = isConnected && selectedDevice?.isConnected;

  useEffect(() => {
    if (isDeviceReady) {
      setIsLoading(true);
      getApps();
      // Safety timeout
      const timeout = setTimeout(() => setIsLoading(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isDeviceReady, getApps]);

  useEffect(() => {
    if (apps.length > 0) {
      setIsLoading(false);
    }
  }, [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apps, searchQuery]);

  const handleLaunch = useCallback((packageName: string) => {
    vibrate([10, 20]);
    launchApp(packageName);
  }, [launchApp, vibrate]);

  if (!isDeviceReady) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" id="apps-screen">
        <div className="w-20 h-20 bg-m3-surface-variant rounded-full flex items-center justify-center mb-6 text-m3-on-surface-variant">
          <Tv className="w-10 h-10 opacity-50" />
        </div>
        <h3 className="text-xl font-display font-semibold text-m3-on-surface mb-2">Device Disconnected</h3>
        <p className="text-m3-on-surface-variant mb-6 max-w-[250px] leading-relaxed">
          Connect to an Android TV device to view and launch installed apps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20" id="apps-screen">
      {/* Floating Search Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative pt-2 sticky top-0 z-10 bg-m3-surface/80 dark:bg-[#111113]/80 backdrop-blur-xl pb-4 border-b border-m3-outline/5 -mx-4 px-4 sm:-mx-6 sm:px-6"
      >
        <div className="relative bg-m3-surface-variant/40 dark:bg-m3-surface-variant/30 border border-m3-outline/10 p-2.5 pl-5 rounded-full flex items-center gap-3 shadow-sm focus-within:border-m3-primary/50 focus-within:shadow-md transition-all">
          <Search className="w-5 h-5 text-m3-on-surface-variant flex-shrink-0" />
          <input
            type="text"
            placeholder="Search installed apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-m3-on-surface placeholder:text-m3-on-surface-variant/70 font-medium text-base"
          />
        </div>
      </motion.div>

      {/* Your Apps - Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-m3-on-surface">
            Installed Apps
          </h2>
          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              vibrate(5);
              setIsLoading(true);
              getApps();
              setTimeout(() => setIsLoading(false), 3000);
            }}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              isLoading
                ? "bg-m3-surface-variant text-m3-on-surface border border-m3-outline/10" 
                : "bg-m3-primary/10 text-m3-primary hover:bg-m3-primary/20"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </motion.button>
        </div>
        
        {isLoading && apps.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] bg-m3-surface-variant" />
                <div className="w-16 h-3 bg-m3-surface-variant rounded-full mt-1" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center bg-m3-surface-variant/30 rounded-[32px] border border-m3-outline/5">
            <AlertCircle className="w-10 h-10 text-m3-on-surface-variant opacity-50 mb-4" />
            <p className="text-m3-on-surface-variant font-medium">No apps found</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-m3-on-surface-variant text-lg">No matches for "{searchQuery}"</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-6">
            <AnimatePresence>
              {filteredApps.map((app) => (
                <AppItem key={app.packageName} app={app} onLaunch={handleLaunch} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}
