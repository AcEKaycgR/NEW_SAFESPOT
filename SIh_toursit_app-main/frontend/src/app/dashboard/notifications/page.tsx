"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, CheckCircle2, Info, Clock, Filter } from "lucide-react";
import { useState } from "react";

const notifications = [
    {
        id: 1,
        icon: AlertTriangle,
        color: "text-red-500",
        title: "High-Risk Zone Entered",
        description: "You have entered the 'South Mumbai Tourist Hub' zone. Please be vigilant.",
        time: "2 mins ago",
        type: "alert",
        read: false
    },
    {
        id: 2,
        icon: Info,
        color: "text-blue-500",
        title: "Itinerary Reminder",
        description: "Your guided tour of Gateway of India starts in 1 hour.",
        time: "58 mins ago",
        type: "info",
        read: false
    },
    {
        id: 3,
        icon: CheckCircle2,
        color: "text-green-500",
        title: "Safety Score Improved",
        description: "Your current location's safety score has increased to 85.",
        time: "3 hours ago",
        type: "success",
        read: true
    },
    {
        id: 4,
        icon: AlertTriangle,
        color: "text-orange-500",
        title: "Geofence Alert",
        description: "Approaching restricted area. Please follow designated tourist paths.",
        time: "1 day ago",
        type: "warning",
        read: true
    },
    {
        id: 5,
        icon: Info,
        color: "text-purple-500",
        title: "Local Event",
        description: "Cultural festival happening nearby. Check local advisories.",
        time: "2 days ago",
        type: "info",
        read: true
    }
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "alerts">("all");
  const [notificationsList, setNotificationsList] = useState(notifications);

  const filteredNotifications = notificationsList.filter(notification => {
    if (filter === "unread") return !notification.read;
    if (filter === "alerts") return notification.type === "alert" || notification.type === "warning";
    return true;
  });

  const markAsRead = (id: number) => {
    setNotificationsList(notificationsList.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotificationsList(notificationsList.map(notification => ({ ...notification, read: true })));
  };

  const unreadCount = notificationsList.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
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
              className="text-3xl"
            >
              🔔
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Notifications & Alerts</h1>
              <p className="text-muted-foreground">
                Recent updates about your safety and itinerary
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {unreadCount} unread
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All Notifications
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("unread")}
                  disabled={unreadCount === 0}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === "alerts" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("alerts")}
                >
                  Safety Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>
                    {filteredNotifications.length} notifications found
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                        notification.read 
                          ? "bg-muted/30 border-border/50" 
                          : "bg-blue-50/50 border-blue-200"
                      }`}
                    >
                      <div className="relative">
                        <notification.icon className={`h-6 w-6 mt-1 ${notification.color}`} />
                        {!notification.read && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => markAsRead(notification.id)}
                            disabled={notification.read}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">No notifications found</h3>
                    <p className="text-muted-foreground">
                      {filter === "unread" 
                        ? "You're all caught up! No unread notifications." 
                        : "No notifications match your current filter."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Customize how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
                  <h4 className="font-medium mb-2">Safety Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Critical safety notifications (always enabled)
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                  <h4 className="font-medium mb-2">Itinerary Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Upcoming tour and activity notifications
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200">
                  <h4 className="font-medium mb-2">Local Events</h4>
                  <p className="text-sm text-muted-foreground">
                    Cultural and community event notifications
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-200">
                  <h4 className="font-medium mb-2">Geofence Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Boundary crossing and zone change alerts
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button variant="outline">
                  Manage Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}