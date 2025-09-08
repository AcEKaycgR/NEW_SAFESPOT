import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Calendar, MapPin, Clock, Edit2, Trash2, Sparkles, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ItineraryItem {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  category: 'sightseeing' | 'food' | 'transport' | 'accommodation' | 'activity';
  safetyScore: number;
}

const Itinerary = () => {
  const [items, setItems] = useState<ItineraryItem[]>([
    {
      id: '1',
      title: 'Taj Mahal Visit',
      description: 'Explore the magnificent Taj Mahal at sunrise',
      location: 'Agra, Uttar Pradesh',
      date: '2024-03-15',
      time: '06:00',
      category: 'sightseeing',
      safetyScore: 95
    },
    {
      id: '2',
      title: 'Local Market Food Tour',
      description: 'Taste authentic street food at Kinari Bazaar',
      location: 'Agra, Uttar Pradesh',
      date: '2024-03-15',
      time: '12:00',
      category: 'food',
      safetyScore: 78
    },
    {
      id: '3',
      title: 'Train to Jaipur',
      description: 'Travel by express train to the Pink City',
      location: 'Agra to Jaipur',
      date: '2024-03-16',
      time: '08:30',
      category: 'transport',
      safetyScore: 88
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    category: 'sightseeing'
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<ItineraryItem[]>([]);

  const categoryColors = {
    sightseeing: 'bg-brand-teal text-white',
    food: 'bg-brand-emerald text-white',
    transport: 'bg-brand-forest text-white',
    accommodation: 'bg-brand-sage text-white',
    activity: 'bg-accent text-accent-foreground'
  };

  const categoryIcons = {
    sightseeing: '🏛️',
    food: '🍛',
    transport: '🚆',
    accommodation: '🏨',
    activity: '🎯'
  };

  const handleAddItem = () => {
    if (newItem.title && newItem.location && newItem.date) {
      const item: ItineraryItem = {
        ...newItem as ItineraryItem,
        id: Date.now().toString(),
        safetyScore: Math.floor(Math.random() * 30) + 70
      };
      setItems([...items, item]);
      setNewItem({
        title: '',
        description: '',
        location: '',
        date: '',
        time: '',
        category: 'sightseeing'
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const aiItems: ItineraryItem[] = [
        {
          id: 'ai1',
          title: 'Kerala Backwater Cruise',
          description: 'Peaceful houseboat journey through Alleppey canals',
          location: 'Alleppey, Kerala',
          date: '2024-03-20',
          time: '09:00',
          category: 'activity',
          safetyScore: 92
        },
        {
          id: 'ai2', 
          title: 'Spice Plantation Tour',
          description: 'Guided tour of cardamom and pepper plantations',
          location: 'Thekkady, Kerala',
          date: '2024-03-21',
          time: '10:30',
          category: 'sightseeing',
          safetyScore: 89
        },
        {
          id: 'ai3',
          title: 'Kathakali Performance',
          description: 'Traditional dance performance with dinner',
          location: 'Kochi, Kerala',
          date: '2024-03-22',
          time: '19:00',
          category: 'activity',
          safetyScore: 94
        }
      ];
      setAiPreview(aiItems);
      setAiGenerating(false);
    }, 2000);
  };

  const acceptAIItems = () => {
    setItems([...items, ...aiPreview]);
    setAiPreview([]);
    setAiPrompt('');
    setIsAIDialogOpen(false);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getSafetyColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              My Itinerary
            </h1>
            <p className="text-muted-foreground">Plan your perfect India adventure</p>
          </div>
          
          <div className="flex gap-3">
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
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-prompt">Describe your ideal trip</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="e.g., 3 days in Kerala focusing on nature and culture..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  {aiPreview.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Generated Plan Preview:</h4>
                      <AnimatePresence>
                        {aiPreview.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{item.title}</h5>
                                <p className="text-sm text-muted-foreground">{item.location}</p>
                              </div>
                              <Badge className={categoryColors[item.category]}>
                                {categoryIcons[item.category]} {item.category}
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
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                          </motion.div>
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate Plan
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
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                      placeholder="e.g., Visit Red Fort"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newItem.location}
                      onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                      placeholder="e.g., Delhi, India"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newItem.time}
                        onChange={(e) => setNewItem({...newItem, time: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
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
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                layout
              >
                <Card className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
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
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.date).toLocaleDateString()}
                            </div>
                            {item.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.time}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getSafetyColor(item.safetyScore)}`}>
                            Safety: {item.safetyScore}%
                          </div>
                        </div>
                        
                        <Badge className={categoryColors[item.category]}>
                          {categoryIcons[item.category]} {item.category}
                        </Badge>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {item.description && (
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  )}
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
            <p className="text-muted-foreground mb-6">Start planning your India adventure!</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Item
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Itinerary;