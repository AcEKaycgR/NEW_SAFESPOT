"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Map from "@/components/safespot/map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, LogOut, MapPin, Users, Calendar, Navigation, Wifi } from "lucide-react";

const groupMembers = [
    { name: "John Doe", avatar: "JD", image: "https://i.pravatar.cc/40?u=a", status: "Safe", isSelf: true },
    { name: "Jane Smith", avatar: "JS", image: "https://i.pravatar.cc/40?u=b", status: "Safe", isSelf: false },
    { name: "Peter Jones", avatar: "PJ", image: "https://i.pravatar.cc/40?u=c", status: "Diverged", isSelf: false },
    { name: "Mary Williams", avatar: "MW", image: "https://i.pravatar.cc/40?u=d", status: "Safe", isSelf: false },
]

const groupItinerary = [
    { time: "10:00 AM", event: "Meet at Gateway of India" },
    { time: "11:00 AM", event: "Ferry to Elephanta Caves" },
    { time: "02:00 PM", event: "Lunch at a local restaurant" },
    { time: "04:00 PM", event: "Return to Colaba" },
]

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
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
              className="inline-block text-3xl mb-2"
            >
              👥
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Travel Groups</h1>
            <p className="text-muted-foreground">
              Connect and travel safely with your group
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Create Group
            </Button>
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Join Group
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-[500px] lg:h-[600px] flex flex-col bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Group Live Map
                </CardTitle>
                <CardDescription>Real-time location of all group members</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <Map />
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="h-4 w-4" />
                  <span>Live tracking active</span>
                </div>
                <Badge variant="default">4 Members</Badge>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Group Info Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Group Card */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>The Explorers</CardTitle>
                <CardDescription>Your current travel group</CardDescription>
                <div className="flex -space-x-2 overflow-hidden pt-2">
                  {groupMembers.map(member => (
                    <Avatar key={member.name} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                      <AvatarImage src={member.image} />
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </h4>
                {groupMembers.map(member => (
                  <motion.div 
                    key={member.name} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.image} />
                        <AvatarFallback>{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name} {member.isSelf && "(You)"}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={member.status === 'Safe' ? 'default' : 'destructive'} 
                      className={member.status === 'Safe' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                    >
                      {member.status}
                    </Badge>
                  </motion.div>
                ))}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" className="w-full gap-2">
                  <UserPlus className="h-4 w-4" /> 
                  Invite
                </Button>
                <Button variant="destructive" className="w-full gap-2">
                  <LogOut className="h-4 w-4" /> 
                  Leave
                </Button>
              </CardFooter>
            </Card>

            {/* Itinerary Card */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Shared Itinerary
                </CardTitle>
                <CardDescription>Today's plan for the group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupItinerary.map((item, index) => (
                  <motion.div 
                    key={item.time} 
                    className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div>
                      <p className="font-medium">{item.event}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Group Settings */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Group Settings</CardTitle>
                <CardDescription>Manage your group preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Location Sharing</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Safety Alerts</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Itinerary Sync</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}