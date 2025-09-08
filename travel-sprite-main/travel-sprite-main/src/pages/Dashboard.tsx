import { motion } from "framer-motion";
import { 
  Map, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  Phone,
  MapPin,
  Clock,
  Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SafetyGauge } from "@/components/ui/safety-gauge";
import { useAppStore } from "@/stores/appStore";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { safetyScore } = useAppStore();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Live Map",
      description: "See safety insights around you",
      icon: Map,
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
      onClick: () => navigate("/map")
    },
    {
      title: "Plan Trip",
      description: "Create safe itineraries with AI",
      icon: Calendar,
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      onClick: () => navigate("/itinerary")
    },
    {
      title: "Safety Alerts",
      description: "Stay updated on local conditions",
      icon: AlertTriangle,
      color: "bg-gradient-to-br from-orange-500 to-red-500",
      onClick: () => navigate("/alerts")
    },
    {
      title: "Emergency",
      description: "Quick access to help",
      icon: Phone,
      color: "bg-gradient-to-br from-red-500 to-pink-600",
      onClick: () => {}
    }
  ];

  const recentActivity = [
    {
      title: "Safety score updated",
      description: "Your current location score: 85/100",
      time: "2 minutes ago",
      icon: Shield,
      color: "text-success"
    },
    {
      title: "New area explored",
      description: "Added Downtown District to your map",
      time: "1 hour ago",
      icon: MapPin,
      color: "text-primary"
    },
    {
      title: "Itinerary completed",
      description: "Museum District tour finished safely",
      time: "3 hours ago",
      icon: Calendar,
      color: "text-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Welcome back, Explorer! 👋
          </h1>
          <p className="text-muted-foreground font-body text-lg">
            Ready for another safe adventure? Here's your travel dashboard.
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Safety Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-normal">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display">Current Safety</CardTitle>
                <CardDescription>Live score for your location</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SafetyGauge 
                  score={safetyScore} 
                  size="lg" 
                  showTrend 
                  trend="up" 
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Quick Actions</CardTitle>
                <CardDescription>Jump into your most used features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={action.onClick}
                      className="p-4 rounded-xl text-left transition-all duration-normal hover:shadow-lg"
                      style={{ background: action.color }}
                    >
                      <action.icon className="h-8 w-8 text-white mb-3" />
                      <h3 className="font-display font-semibold text-white mb-1">
                        {action.title}
                      </h3>
                      <p className="text-white/80 text-sm font-body">
                        {action.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest safety updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/20 transition-colors duration-normal"
                  >
                    <div className={`p-2 rounded-lg bg-background ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground font-body">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats & Emergency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Today's Highlights
                </CardTitle>
                <CardDescription>Your safety journey stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
                  >
                    <div className="font-display font-bold text-2xl text-success">12</div>
                    <div className="text-sm text-muted-foreground">Safe Areas</div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"
                  >
                    <div className="font-display font-bold text-2xl text-primary">2.5km</div>
                    <div className="text-sm text-muted-foreground">Explored</div>
                  </motion.div>
                </div>

                {/* Emergency Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg" 
                    variant="destructive" 
                    className="w-full font-display font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Emergency Contact
                  </Button>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  className="flex items-center justify-center space-x-4 text-sm text-muted-foreground"
                >
                  <Users className="h-4 w-4" />
                  <span>3 trusted contacts nearby</span>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;