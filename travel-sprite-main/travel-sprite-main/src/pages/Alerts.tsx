import { motion } from "framer-motion";
import { Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Alerts = () => {
  const alerts = [
    {
      id: 1,
      type: "warning",
      title: "Weather Alert",
      description: "Heavy rain expected in your area. Consider indoor activities.",
      time: "5 minutes ago",
      priority: "medium",
      icon: AlertTriangle,
      color: "text-warning"
    },
    {
      id: 2,
      type: "info",
      title: "Area Update",
      description: "New safety data available for Downtown District.",
      time: "1 hour ago",
      priority: "low",
      icon: Info,
      color: "text-primary"
    },
    {
      id: 3,
      type: "success",
      title: "Trip Completed",
      description: "Great job! You've safely completed your museum tour.",
      time: "3 hours ago",
      priority: "low",
      icon: CheckCircle,
      color: "text-success"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive";
      case "medium": return "bg-warning";
      default: return "bg-primary";
    }
  };

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
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2 flex items-center">
            <Bell className="h-8 w-8 mr-3" />
            Safety Alerts
          </h1>
          <p className="text-muted-foreground font-body text-lg">
            Stay informed about conditions that matter to your safety.
          </p>
        </motion.div>

        {/* Alerts List */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-normal">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg bg-background ${alert.color}`}>
                      <alert.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-semibold text-foreground">
                          {alert.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={`${getPriorityColor(alert.priority)} text-white`}
                          >
                            {alert.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.time}
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground font-body">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State for Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="text-6xl mb-4">✨</div>
          <p className="text-muted-foreground font-body">
            You're all caught up! We'll notify you of any new safety updates.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Alerts;