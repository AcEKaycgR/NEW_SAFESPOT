"use client";

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Siren, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { socketService } from '@/lib/socket';

export default function SosButton() {
  const [dispatchState, setDispatchState] = useState<'idle' | 'pending' | 'dispatched'>('idle');
  const { toast } = useToast();
  const [touristData, setTouristData] = useState({
    id: 'tourist_123', // In real app, get from auth context
    name: 'John Doe',
    location: { lat: 19.0760, lng: 72.8777 } // Mumbai coordinates
  });

  useEffect(() => {
    // Only set up listeners in browser environment
    if (typeof window !== 'undefined') {
      // Listen for SOS acknowledgment
      socketService.onSOSAcknowledged((data) => {
        setDispatchState('dispatched');
        toast({
          title: "Help is on the way",
          description: `Your SOS has been acknowledged by admin.`,
        });
      });

      // Cleanup listeners on component unmount
      return () => {
        socketService.getSocket().off('SOS_ACKNOWLEDGED');
      };
    }
  }, [toast]);

  const handleSosConfirm = () => {
    setDispatchState('pending');
    
    // Send SOS via WebSocket
    const sosData = {
      touristId: touristData.id,
      name: touristData.name,
      location: touristData.location,
      message: "Emergency SOS triggered by tourist"
    };
    
    console.log('Sending SOS data:', sosData);
    socketService.sendSOS(sosData);

    toast({
      title: "SOS Signal Sent",
      description: "Authorities have been notified of your location.",
    });

    setTimeout(() => {
      if (dispatchState === 'pending') {
        setDispatchState('dispatched');
        toast({
          title: "Dispatch Confirmed",
          description: "Help is on the way. Please stay in a safe location.",
        });
      }
    }, 3000);
  };

  const handleReset = () => {
      setDispatchState('idle');
  }

  if (dispatchState !== 'idle') {
      return (
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
      )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full h-24 rounded-2xl shadow-lg transform active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-4">
            <Siren className="h-10 w-10" />
            <div className="text-left">
                <p className="text-2xl font-bold">PANIC</p>
                <p className="font-light">Tap for Emergency</p>
            </div>
          </div>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
            <div className="flex justify-center">
                <div className="rounded-full border-4 border-destructive p-4">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
            </div>
          <AlertDialogTitle className="text-center text-2xl">Confirm SOS Activation</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This will immediately send your live location and personal details to the nearest police authority. Only use this in a genuine emergency.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSosConfirm}>Confirm & Send Alert</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
