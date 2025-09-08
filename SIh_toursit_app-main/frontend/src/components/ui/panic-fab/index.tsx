"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { AlertTriangle, Phone, MapPin, Users, X, Siren, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const PanicFAB = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWobbling, setIsWobbling] = useState(true);
  const [dispatchState, setDispatchState] = useState<'idle' | 'pending' | 'dispatched'>('idle');
  const { toast } = useToast();

  // Stop wobbling after 10 seconds to avoid distraction
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWobbling(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleSosConfirm = () => {
    setDispatchState('pending');
    toast({
      title: "SOS Signal Sent",
      description: "Authorities have been notified of your location.",
    });

    setTimeout(() => {
        setDispatchState('dispatched');
        toast({
            title: "Dispatch Confirmed",
            description: "Help is on the way. Please stay in a safe location.",
          });
    }, 3000);
  };

  const handleReset = () => {
      setDispatchState('idle');
  };

  const emergencyContacts = [
    { name: "Emergency Services", number: "112", type: "emergency" },
    { name: "Tourist Helpline", number: "1363", type: "tourist" },
    { name: "Mom", number: "+91 98765 12345", type: "personal" },
    { name: "Dad", number: "+91 98765 67890", type: "personal" }
  ];

  // If we're in a dispatch state, show the existing SOS component
  if (dispatchState !== 'idle') {
      return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-yellow-500 bg-yellow-500/10 p-8 text-center">
                {dispatchState === 'pending' ? (
                    <>
                        <div className="relative flex items-center justify-center">
                             <Siren className="h-16 w-16 animate-ping text-yellow-500" />
                             <Siren className="absolute h-16 w-16 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-semibold">Awaiting Dispatch...</h3>
                        <p className="text-muted-foreground">Your SOS has been received. Connecting to the nearest authority.</p>
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <h3 className="text-xl font-semibold">Help is on the way</h3>
                        <p className="text-muted-foreground">A unit has been dispatched to your location. Stay on the line if possible.</p>
                        <Button variant="outline" onClick={handleReset}>Close Status</Button>
                    </>
                )}
            </div>
        </div>
      )
  }

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              rotate: isWobbling ? [0, -5, 5, 0] : 0
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3,
              rotate: {
                duration: 1,
                repeat: isWobbling ? Infinity : 0,
                ease: "easeInOut"
              }
            }}
            className="fixed bottom-6 right-6 z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(true)}
              className="w-16 h-16 bg-destructive text-destructive-foreground rounded-full shadow-xl flex items-center justify-center relative overflow-hidden"
            >
              {/* Ripple effect */}
              <motion.div
                animate={{ 
                  scale: [1, 2.5, 1],
                  opacity: [0.3, 0, 0.3] 
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-destructive rounded-full"
              />
              
              <AlertTriangle className="h-8 w-8 relative z-10" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Panel */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsExpanded(false)}
            />

            {/* Emergency Panel */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <Card className="rounded-t-3xl border-t border-x-0 border-b-0 shadow-2xl">
                <CardHeader className="bg-destructive text-destructive-foreground rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                      >
                        <AlertTriangle className="h-8 w-8" />
                      </motion.div>
                      Emergency Mode
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(false)}
                      className="text-destructive-foreground hover:bg-destructive-foreground/20"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-destructive-foreground/90">
                    Your location is being shared with trusted contacts
                  </p>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      className="h-20 flex-col gap-2 bg-destructive hover:bg-destructive/90"
                      onClick={handleSosConfirm}
                    >
                      <Siren className="h-6 w-6" />
                      Send SOS Alert
                    </Button>
                    
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-20 flex-col gap-2"
                    >
                      <MapPin className="h-6 w-6" />
                      Share Location
                    </Button>
                  </div>

                  {/* Emergency Contacts */}
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Emergency Contacts
                    </h3>
                    <div className="space-y-3">
                      {emergencyContacts.map((contact, index) => (
                        <motion.div
                          key={contact.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full justify-between h-auto p-4"
                            onClick={() => window.open(`tel:${contact.number}`)}
                          >
                            <div className="text-left">
                              <div className="font-medium">{contact.name}</div>
                              <div className="text-sm text-muted-foreground">{contact.number}</div>
                            </div>
                            <Phone className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Safety Tips */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Safety Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Stay calm and move to a safe location</li>
                      <li>• Keep your phone charged and accessible</li>
                      <li>• Trust your instincts and seek help if needed</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};