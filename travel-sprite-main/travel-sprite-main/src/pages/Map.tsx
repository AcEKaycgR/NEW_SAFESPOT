import { motion } from "framer-motion";
import { MapPin, Navigation, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Map = () => {
  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Coming Soon Display */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
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
            className="inline-block text-6xl mb-4"
          >
            🗺️
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Interactive Safety Map
          </h1>
          <p className="text-muted-foreground font-body text-lg">
            Coming soon! Real-time safety insights with beautiful 3D mapping.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: "Live Safety Zones",
              description: "Color-coded areas showing real-time safety levels",
              icon: Shield,
              color: "bg-gradient-to-br from-green-500 to-emerald-600"
            },
            {
              title: "Smart Navigation",
              description: "AI-powered route planning for maximum safety",
              icon: Navigation,
              color: "bg-gradient-to-br from-blue-500 to-cyan-600"
            },
            {
              title: "Points of Interest",
              description: "Discover safe attractions, restaurants, and services",
              icon: MapPin,
              color: "bg-gradient-to-br from-purple-500 to-pink-600"
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-normal h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="font-display">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" className="font-display">
            <Zap className="h-5 w-5 mr-2" />
            Get Notified When Ready
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Map;