"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Plane, Hotel, MapPin, PlusCircle, AlertTriangle, Bot, User, Loader2 } from "lucide-react";
import { touristAssistant } from "@/app/actions";
import type { TouristAssistantOutput } from "@/ai/flows/tourist-assistant";
import type { ItineraryItem as ItineraryItemType } from "@/ai/schemas/itinerary-item";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useItineraryStore } from "@/store/itinerary-store";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  data?: TouristAssistantOutput;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();
  const addItineraryItems = useItineraryStore(state => state.addItems);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    // Initial greeting from AI
    setMessages([
      {
        id: 'init',
        sender: 'ai',
        text: "Hello! I'm your SafeSpot assistant. How can I help you today? You can tell me your travel plans, ask safety questions, or report an emergency.",
      }
    ]);
  }, []);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await touristAssistant({ message: input });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: result.responseText,
        data: result,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get a response from the assistant.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItinerary = (items: ItineraryItemType[] | undefined) => {
    if (!items) return;
    const iconMap = { flight: Plane, hotel: Hotel, activity: MapPin, other: MapPin };
    const newItems = items.map(item => ({...item, icon: iconMap[item.type]}));
    addItineraryItems(newItems);
    toast({
        title: "Itinerary Updated",
        description: `${items.length} item(s) have been added to your itinerary.`
    })
  }

  const renderMessageContent = (message: Message) => {
    const { data } = message;

    if (data?.isEmergency) {
        return (
            <Card className="border-destructive bg-destructive/10">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <div>
                        <CardTitle>Emergency Assistance</CardTitle>
                        <CardDescription>Immediate action may be required.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="font-medium">{message.text}</p>
                    <p className="text-sm text-muted-foreground mt-2">Authorities are being notified. Please follow the instructions provided.</p>
                </CardContent>
            </Card>
        )
    }

    if (data?.intent === 'itinerary' && data.itineraryItems && data.itineraryItems.length > 0) {
        const iconMap = { flight: Plane, hotel: Hotel, activity: MapPin, other: MapPin };
        return (
            <div className="space-y-4">
                 <p>{message.text}</p>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Suggested Itinerary Items</CardTitle>
                        <CardDescription>Review these items parsed from your message.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.itineraryItems.map((item, index) => {
                             const Icon = iconMap[item.type] || MapPin;
                             return (
                                <div key={index} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                                    <Icon className="h-5 w-5 text-primary mt-1" />
                                    <div>
                                        <p className="font-semibold">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{new Date(item.date).toDateString()}</p>
                                        {item.details && <p className="text-xs text-muted-foreground">{item.details}</p>}
                                    </div>
                                </div>
                             )
                        })}
                         <Button className="w-full mt-4" onClick={() => handleAddItinerary(data.itineraryItems)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add to My Itinerary
                        </Button>
                    </CardContent>
                 </Card>
            </div>
        )
    }

    return <p>{message.text}</p>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto h-full flex flex-col"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="inline-block text-4xl mb-2"
          >
            🤖
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Travel Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Your personal travel companion powered by AI
          </p>
        </div>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg flex flex-col"
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "ai" && (
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs md:max-w-md rounded-2xl p-4 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted rounded-bl-none"
                  }`}
                >
                  {renderMessageContent(message)}
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 justify-start"
              >
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-xs md:max-w-md rounded-2xl p-4 bg-muted rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="italic text-muted-foreground">Assistant is typing...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                placeholder="Ask for help or tell me your plans..."
                disabled={isLoading}
                className="flex-1 h-12 rounded-full px-4"
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading}
                size="lg"
                className="rounded-full h-12 w-12 p-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full text-xs"
                onClick={() => setInput("Plan a 3-day trip to Goa")}
              >
                Plan a trip
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full text-xs"
                onClick={() => setInput("What are safe areas to visit in Mumbai?")}
              >
                Safety tips
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full text-xs"
                onClick={() => setInput("Emergency help needed")}
              >
                Emergency
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Assistant Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                What I Can Help With
              </CardTitle>
              <CardDescription>
                Your AI assistant can help with various travel needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
                  <h4 className="font-medium mb-2">Trip Planning</h4>
                  <p className="text-sm text-muted-foreground">
                    Create detailed itineraries for your travels
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                  <h4 className="font-medium mb-2">Safety Advice</h4>
                  <p className="text-sm text-muted-foreground">
                    Get real-time safety information and recommendations
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-red-50/50 border border-red-200">
                  <h4 className="font-medium mb-2">Emergency Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Immediate assistance in critical situations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}