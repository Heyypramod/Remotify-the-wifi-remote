import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tv, Signal, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, X, MonitorSpeaker, Speaker, Cast, KeyRound } from "lucide-react";
import { useRemote } from "../context/RemoteContext";
import { ConnectionState, RemoteCommandType } from "../types/remote";
import { useHaptics } from "../hooks/useHaptics";

const getDeviceIcon = (type: string, className: string = "w-6 h-6") => {
  const t = type.toLowerCase();
  if (t.includes('tv')) return <Tv className={className} />;
  if (t.includes('display') || t.includes('monitor')) return <MonitorSpeaker className={className} />;
  if (t.includes('speaker') || t.includes('audio')) return <Speaker className={className} />;
  return <Cast className={className} />;
};

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [ipAddress, setIpAddress] = useState("");
  const [pairingPin, setPairingPin] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  
  const { connectionState, devices, listDevices, connectToDevice, providePin } = useRemote();
  const { vibrate } = useHaptics();

  // Watch for devices to see if we successfully connected
  useEffect(() => {
    let intervalId: any;
    if (step === 1 && connectionState !== ConnectionState.WAITING_FOR_PAIRING_PIN && connectionState !== ConnectionState.CONNECTED) {
      listDevices();
      intervalId = setInterval(() => {
        listDevices();
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [step, connectionState, listDevices]);

  // Watch connection state
  useEffect(() => {
    if (connectionState === ConnectionState.WAITING_FOR_PAIRING_PIN) {
      setIsConnecting(false);
      setStep(2); // Pairing PIN step
      vibrate([20, 50, 20]);
    } else if (connectionState === ConnectionState.CONNECTED) {
      setIsConnecting(false);
      setStep(3); // Go to success step
      vibrate([20, 50, 20]);
    } else if (connectionState === ConnectionState.FAILED) {
      setIsConnecting(false);
      if (step === 2) {
        setError("Invalid PIN or pairing failed. Please try again.");
      } else {
        setError(`Failed to connect to ${ipAddress}.`);
      }
      vibrate([40, 20, 40]);
    }
  }, [connectionState, ipAddress, vibrate, step]);

  const handleConnect = (targetIp?: string) => {
    const ip = targetIp || ipAddress;
    if (!ip) return;
    
    setIpAddress(ip);
    setError(null);
    setIsConnecting(true);
    vibrate(10);
    
    connectToDevice(ip.trim());
  };

  const submitPin = () => {
    if (pairingPin.length < 1) return;
    setIsConnecting(true);
    setError(null);
    providePin(pairingPin);
  };

  const nextStep = () => {
    vibrate(10);
    setStep((s) => s + 1);
  };
  
  const finishOnboarding = () => {
    vibrate(20);
    localStorage.setItem("remotify_onboarding_completed", "true");
    onComplete();
  };

  const availableTvs = useMemo(() => {
    return devices.filter(d => !d.isConnected);
  }, [devices]);

  return (
    <div className="absolute inset-0 z-50 bg-m3-background flex flex-col pt-[calc(env(safe-area-inset-top)+2rem)] pb-[env(safe-area-inset-bottom)] overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 bg-gradient-to-b from-m3-surface/20 to-m3-background pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[50%] bg-orange-500/10 blur-[100px] pointer-events-none rounded-full" />
      
      <main className="flex-1 overflow-y-auto px-6 flex flex-col z-10 w-full relative h-full">
        <AnimatePresence mode="wait">
          {/* STEP 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[32px] flex items-center justify-center shadow-lg shadow-orange-500/20 mb-8"
              >
                <MonitorSpeaker className="w-12 h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-display font-bold text-m3-on-surface mb-4 tracking-tight"
              >
                Remotify
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-m3-on-surface-variant text-lg leading-relaxed mb-12"
              >
                A beautifully minimal remote experience for Android TV and Google TV.
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <button
                  onClick={nextStep}
                  className="w-full h-14 rounded-full bg-m3-primary text-m3-on-primary font-semibold text-lg hover:bg-m3-primary/90 focus:scale-[0.98] transition-all flex items-center justify-center shadow-md shadow-m3-primary/20"
                >
                  Get Started
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 1: Connect / Discovery */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative pt-10"
            >
              <h2 className="text-3xl font-display font-bold text-m3-on-surface mb-2">Connect TV</h2>
              <p className="text-m3-on-surface-variant font-medium mb-8">
                {showManualInput ? "Enter the IP address of your Android TV to connect." : "Select your Android TV to connect."}
              </p>
              
              <div className="flex-1 overflow-y-auto mb-4">
                {isConnecting ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center text-m3-on-surface-variant gap-4 py-12"
                  >
                    <RefreshCw className="w-10 h-10 text-m3-primary animate-spin" />
                    <p className="text-sm font-medium animate-pulse text-center">
                      Requesting connection...<br/>
                    </p>
                  </motion.div>
                ) : showManualInput ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-m3-surface-variant/50 rounded-[32px] p-6 border border-m3-outline/10 focus-within:border-m3-primary/50 focus-within:ring-4 ring-m3-primary/10 transition-all">
                      <label className="text-xs font-semibold text-m3-primary uppercase tracking-wider mb-2 block">IP Address</label>
                      <input
                        type="text"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        placeholder="192.168.1.x"
                        className="w-full bg-transparent text-3xl font-display font-medium text-m3-on-surface outline-none placeholder:text-m3-on-surface-variant/30"
                        autoFocus
                        disabled={isConnecting}
                        onKeyDown={(e) => e.key === 'Enter' && ipAddress && handleConnect()}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {availableTvs.length > 0 ? (
                      availableTvs.map((device, i) => (
                        <motion.div
                          key={device.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 17 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleConnect(device.ipAddress || device.id.split(':')[0])}
                          className="bg-m3-surface/50 dark:bg-[#1E1E20]/50 hover:bg-m3-surface-variant dark:hover:bg-[#2A2A2E] rounded-[24px] p-4 border border-m3-outline/10 shadow-sm flex items-center gap-4 cursor-pointer group transition-all"
                        >
                          <div className={`w-14 h-14 bg-m3-surface-variant/50 rounded-[20px] flex items-center justify-center transition-colors shadow-sm text-m3-on-surface-variant`}>
                            {getDeviceIcon(device.type, "w-6 h-6")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-semibold text-m3-on-surface text-base group-hover:text-m3-primary transition-colors">
                              {device.name}
                            </h4>
                            <p className="text-xs text-m3-on-surface-variant mt-0.5">
                              {device.ipAddress || device.id.split(':')[0]}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-m3-on-surface-variant/50 group-hover:text-m3-primary/70" />
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-m3-on-surface-variant opacity-70">
                        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-m3-primary/70" />
                        <p className="text-sm font-medium">Searching for nearby TVs...</p>
                        <p className="text-xs mt-2 text-center max-w-[200px]">Make sure your TV and phone are on the same Wi-Fi network.</p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowManualInput(true)}
                      className="w-full mt-4 py-4 text-sm font-semibold text-m3-primary hover:bg-m3-primary/5 rounded-2xl transition-colors"
                    >
                      Enter TV IP manually
                    </button>
                  </motion.div>
                )}
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, mt: 0 }}
                      animate={{ opacity: 1, height: 'auto', mt: 16 }}
                      exit={{ opacity: 0, height: 0, mt: 0 }}
                      className="text-red-500 text-sm font-medium flex items-start gap-2 bg-red-500/10 p-4 rounded-2xl"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="pb-8 pt-2 flex gap-4 mt-auto">
                <button
                  onClick={() => {
                    if (showManualInput && !isConnecting) {
                      setShowManualInput(false);
                      setError(null);
                    } else {
                      setStep(0); 
                      setError(null); 
                      setIsConnecting(false);
                      setShowManualInput(false);
                    }
                  }}
                  className="w-14 h-14 rounded-full bg-m3-surface-variant text-m3-on-surface flex items-center justify-center focus:scale-95 transition-all flex-shrink-0"
                  disabled={isConnecting}
                >
                  <X className="w-5 h-5" />
                </button>
                {showManualInput && (
                  <button
                    onClick={() => handleConnect()}
                    disabled={!ipAddress || isConnecting}
                    className="flex-1 h-14 rounded-full bg-m3-primary text-m3-on-primary font-semibold text-lg hover:bg-m3-primary/90 focus:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Signal className="w-5 h-5 mr-2" />
                    Connect
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Pairing PIN Input */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative pt-10"
            >
              <div className="w-16 h-16 bg-m3-primary/10 rounded-full flex items-center justify-center text-m3-primary mb-6">
                <KeyRound className="w-8 h-8" />
              </div>
              
              <h2 className="text-3xl font-display font-bold text-m3-on-surface mb-2">Check Your TV</h2>
              <p className="text-m3-on-surface-variant font-medium mb-8">
                Enter the 6-digit pairing code shown on your TV screen.
              </p>
              
              <div className="flex-1 mb-4">
                <div className="bg-m3-surface-variant/50 rounded-[32px] p-6 border border-m3-outline/10 focus-within:border-m3-primary/50 focus-within:ring-4 ring-m3-primary/10 transition-all">
                  <label className="text-xs font-semibold text-m3-primary uppercase tracking-wider mb-2 block">Pairing PIN</label>
                  <input
                    type="text"
                    value={pairingPin}
                    onChange={(e) => setPairingPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full bg-transparent text-5xl font-display font-medium text-m3-on-surface outline-none placeholder:text-m3-on-surface-variant/30 tracking-widest text-center"
                    autoFocus
                    maxLength={6}
                    disabled={isConnecting}
                    onKeyDown={(e) => e.key === 'Enter' && pairingPin.length === 6 && submitPin()}
                  />
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, mt: 0 }}
                      animate={{ opacity: 1, height: 'auto', mt: 16 }}
                      exit={{ opacity: 0, height: 0, mt: 0 }}
                      className="text-red-500 text-sm font-medium flex items-start gap-2 bg-red-500/10 p-4 rounded-2xl mt-4"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pb-8 pt-2 flex gap-4 mt-auto">
                <button
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setIsConnecting(false);
                  }}
                  className="w-14 h-14 rounded-full bg-m3-surface-variant text-m3-on-surface flex items-center justify-center focus:scale-95 transition-all flex-shrink-0"
                  disabled={isConnecting}
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={submitPin}
                  disabled={pairingPin.length < 1 || isConnecting}
                  className="flex-1 h-14 rounded-full bg-m3-primary text-m3-on-primary font-semibold text-lg hover:bg-m3-primary/90 focus:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Pair Device
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full"
            >
               <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                 className="w-32 h-32 mb-8 relative flex items-center justify-center"
               >
                 <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                 <div className="w-full h-full bg-m3-surface border border-m3-outline/10 shadow-xl rounded-full flex items-center justify-center z-10 text-green-500">
                    <CheckCircle2 className="w-16 h-16" />
                 </div>
               </motion.div>
               
               <h2 className="text-4xl font-display font-bold text-m3-on-surface mb-4">Your TV is ready.</h2>
               <p className="text-lg text-m3-on-surface-variant font-medium mb-12">
                 You're connected successfully. Welcome to Remotify.
               </p>
               
               <button
                  onClick={finishOnboarding}
                  className="w-full h-14 rounded-full bg-m3-primary text-m3-on-primary font-semibold text-lg hover:bg-m3-primary/90 focus:scale-[0.98] transition-all shadow-md shadow-m3-primary/20"
                >
                  Open Remote
                </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// Missing icons
function WifiIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

