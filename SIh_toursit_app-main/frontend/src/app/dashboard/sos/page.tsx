"use client";

import { motion } from "framer-motion";
import SosButton from "@/components/safespot/sos-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MessageSquare, Shield, AlertTriangle, User, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SosPage() {
  const emergencyContacts = [
    {
      name: "Police",
      number: "100",
      icon: Phone,
      color: "bg-blue-500",
      description: "Law enforcement and crime reporting"
    },
    {
      name: "Ambulance",
      number: "102",
      icon: MessageSquare,
      color: "bg-red-500",
      description: "Medical emergency services"
    },
    {
      name: "Disaster Mgmt",
      number: "108",
      icon: Shield,
      color: "bg-green-500",
      description: "Disaster response and management"
    },
    {
      name: "Tourist Helpline",
      number: "1363",
      icon: User,
      color: "bg-purple-500",
      description: "Tourist assistance and support"
    },
    {
      name: "Women Helpline",
      number: "1091",
      icon: Shield,
      color: "bg-pink-500",
      description: "Women's safety and support"
    },
    {
      name: "Fire Department",
      number: "101",
      icon: AlertTriangle,
      color: "bg-orange-500",
      description: "Fire and rescue services"
    }
  ];

  const trustedContacts = [
    {
      name: "Emergency Contact 1",
      number: "+91 98765 43210",
      relationship: "Family"
    },
    {
      name: "Emergency Contact 2",
      number: "+91 98765 01234",
      relationship: "Friend"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="inline-block text-4xl mb-4"
          >
            🚨
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Emergency SOS</h1>
          <p className="text-muted-foreground mt-2">
            Press the button in a genuine emergency. Help is just one tap away.
          </p>
        </div>

        {/* SOS Button Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-grow flex items-center justify-center py-8"
        >
          <div className="w-full max-w-sm">
            <SosButton />
          </div>
        </motion.div>

        {/* Emergency Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Important Information
              </CardTitle>
              <CardDescription>
                What happens when you press the SOS button
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Location Sharing</h4>
                  </div>
                  <p className="text-sm text-blue-800">
                    Your exact location is immediately sent to emergency services
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-red-50/50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <h4 className="font-medium text-red-900">Rapid Response</h4>
                  </div>
                  <p className="text-sm text-red-800">
                    Emergency services are dispatched within minutes
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-900">Contact Notification</h4>
                  </div>
                  <p className="text-sm text-green-800">
                    Your trusted contacts are notified of your emergency
                  </p>
                </div>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-medium text-destructive mb-2">⚠️ Use Responsibly</h4>
                <p className="text-sm text-destructive">
                  The SOS button is for genuine emergencies only. Misuse can result in legal consequences 
                  and may delay response to real emergencies.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>Quick access to local emergency services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {emergencyContacts.map((contact, index) => (
                  <motion.a
                    key={contact.name}
                    href={`tel:${contact.number}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted hover:bg-secondary transition-all cursor-pointer border border-border"
                  >
                    <div className={`p-3 rounded-full ${contact.color} text-white`}>
                      <contact.icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-foreground">{contact.name}</span>
                      <span className="text-xs text-muted-foreground block">{contact.number}</span>
                      <span className="text-xs text-muted-foreground mt-1 block">{contact.description}</span>
                    </div>
                  </motion.a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trusted Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Trusted Contacts</CardTitle>
              <CardDescription>Your personal emergency contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trustedContacts.map((contact, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`tel:${contact.number}`)}
                    >
                      {contact.number}
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  Manage Trusted Contacts
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Safety Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Safety Tips</CardTitle>
              <CardDescription>Essential information for emergencies</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Keep your phone charged and accessible at all times</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Memorize important emergency numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Stay in well-lit, populated areas when possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Trust your instincts - if something feels wrong, seek help</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Keep a copy of important documents and emergency contacts</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}