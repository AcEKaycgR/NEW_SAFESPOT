"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Plus, Calendar, MapPin, Clock, Edit2, Trash2, Sparkles, GripVertical, Plane, Hotel, Loader2, Navigation, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/safespot/date-picker-with-range";
import { useItineraryStore } from "@/store/itinerary-store";
import { touristAssistant } from "@/app/actions";
import type { TouristAssistantOutput } from "@/ai/flows/tourist-assistant";
import type { ItineraryItem as ItineraryItemType } from "@/ai/schemas/itinerary-item";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ItineraryPage() {
  const { items, addItems, removeItem } = useItineraryStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    details: '',
    date: '',
    type: 'other' as 'flight' | 'hotel' | 'activity' | 'other'
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const { toast } = useToast();

  // Get current location for AI assistant
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  }, []);

  const categoryColors = {
    flight: 'bg-blue-500 text-white',
    hotel: 'bg-purple-500 text-white',
    activity: 'bg-green-500 text-white',
    other: 'bg-gray-500 text-white'
  };

  const categoryLabels = {
    flight: 'Flight',
    hotel: 'Hotel',
    activity: 'Activity',
    other: 'Other'
  };

  const handleAddItem = () => {
    if (newItem.title && newItem.date) {
      const item = {
        icon: newItem.type === 'flight' ? Plane : (newItem.type === 'hotel' ? Hotel : MapPin),
        title: newItem.title,
        date: newItem.date,
        details: newItem.details,
        type: newItem.type
      };
      addItems([item]);
      setNewItem({
        title: '',
        details: '',
        date: '',
        type: 'other'
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setAiGenerating(true);
    setAiPreview([]);
    
    try {
      // Create input with current location
      const input = {
        message: aiPrompt,
        currentLocation: currentLocation || undefined
      };
      
      console.log('Generating AI itinerary with input:', input);
      
      const result = await touristAssistant(input);
      
      if (result.intent === 'itinerary' && result.itineraryItems && result.itineraryItems.length > 0) {
        const iconMap = { flight: Plane, hotel: Hotel, activity: MapPin, other: MapPin };
        const aiItems = result.itineraryItems.map(item => ({
          icon: iconMap[item.type] || MapPin,
          title: item.title,
          date: item.date,
          details: item.details || '',
          type: item.type
        }));
        setAiPreview(aiItems);
      } else {
        toast({
          title: "No Itinerary Generated",
          description: "The AI assistant didn't generate any itinerary items. Please try rephrasing your request with more specific details like '3 days in Jaipur focusing on historical sites and culture'.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating AI itinerary:", error);
      toast({
        title: "Error",
        description: "Failed to generate itinerary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const acceptAIItems = () => {
    addItems(aiPreview);
    setAiPreview([]);
    setAiPrompt('');
    setIsAIDialogOpen(false);
    toast({
      title: "Itinerary Updated",
      description: `${aiPreview.length} item(s) have been added to your itinerary.`
    });
  };

  const getSafetyColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              My Itinerary
            </h1>
            <p className="text-muted-foreground">Plan your perfect travel experience</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>AI Itinerary Generator</DialogTitle>
                  <CardDescription>
                    Describe your ideal trip to generate a personalized itinerary
                  </CardDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-prompt">Describe your ideal trip</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="e.g., 3 days in Jaipur focusing on historical sites and culture..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="mt-1"
                      disabled={aiGenerating}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current location detected: {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'Not available'}
                    </p>
                  </div>
                  
                  {aiPreview.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Generated Plan Preview:</h4>
                      <AnimatePresence>
                        {aiPreview.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{item.title}</h5>
                                <p className="text-sm text-muted-foreground">{item.details}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(item.date).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className={categoryColors[item.type]}>
                                {categoryLabels[item.type]}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {aiPreview.length === 0 ? (
                      <Button 
                        onClick={handleAIGenerate} 
                        disabled={!aiPrompt.trim() || aiGenerating}
                        className="w-full"
                      >
                        {aiGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Plan
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button onClick={acceptAIItems} className="flex-1">
                          Add to Itinerary
                        </Button>
                        <Button variant="outline" onClick={() => setAiPreview([])} className="flex-1">
                          Regenerate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                  <CardDescription>
                    Add a new item to your travel itinerary
                  </CardDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                      placeholder="e.g., Flight to Jaipur"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newItem.date}
                      onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      value={newItem.type}
                      onChange={(e) => setNewItem({...newItem, type: e.target.value as any})}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="flight">Flight</option>
                      <option value="hotel">Hotel</option>
                      <option value="activity">Activity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="details">Details</Label>
                    <Textarea
                      id="details"
                      value={newItem.details}
                      onChange={(e) => setNewItem({...newItem, details: e.target.value})}
                      placeholder="Describe your planned activity..."
                    />
                  </div>
                  
                  <Button onClick={handleAddItem} className="w-full">
                    Add Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Itinerary Items */}
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                layout
              >
                <Card className="hover:shadow-lg transition-all duration-300 group bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="p-2 rounded-lg bg-muted cursor-grab active:cursor-grabbing"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <GripVertical className="h-4 w-4" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-xl">{item.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.details || 'No details'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={categoryColors[item.type]}>
                          {categoryLabels[item.type]}
                        </Badge>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeItem(item.title)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items in your itinerary yet</h3>
            <p className="text-muted-foreground mb-6">Start planning your adventure!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Item
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/dashboard/assistant">
                  <Sparkles className="h-4 w-4" />
                  Use AI Assistant
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}