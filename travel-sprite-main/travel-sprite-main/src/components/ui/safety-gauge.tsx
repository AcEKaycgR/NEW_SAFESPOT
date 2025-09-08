import { motion } from "framer-motion";
import { Shield, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

interface SafetyGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  trend?: "up" | "down" | "stable";
}

export const SafetyGauge = ({ 
  score, 
  size = "md", 
  showTrend = false, 
  trend = "stable" 
}: SafetyGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  const sizeConfig = {
    sm: { size: 80, strokeWidth: 8, textSize: "text-lg" },
    md: { size: 120, strokeWidth: 10, textSize: "text-2xl" },
    lg: { size: 160, strokeWidth: 12, textSize: "text-4xl" }
  };

  const config = sizeConfig[size];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "hsl(var(--success))";
    if (score >= 60) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-400 to-emerald-500";
    if (score >= 60) return "from-yellow-400 to-orange-500";
    return "from-red-400 to-pink-500";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
            fill="none"
            className="opacity-20"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke={getScoreColor(score)}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ 
              duration: 1.5, 
              ease: "easeInOut",
              delay: 0.2
            }}
            style={{
              filter: `drop-shadow(0 0 8px ${getScoreColor(score)}40)`
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.8,
              type: "spring",
              stiffness: 200
            }}
            className={`p-2 rounded-full bg-gradient-to-r ${getScoreGradient(score)} mb-1`}
          >
            <Shield className="h-4 w-4 text-white" />
          </motion.div>
          
          <motion.span 
            className={`font-display font-bold ${config.textSize} text-foreground`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            {Math.round(animatedScore)}
          </motion.span>
          
          <span className="text-xs text-muted-foreground font-body">Safety Score</span>
        </div>
      </div>

      {showTrend && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="flex items-center mt-2 text-sm"
        >
          {trend === "up" && (
            <>
              <TrendingUp className="h-4 w-4 text-success mr-1" />
              <span className="text-success font-medium">Improving</span>
            </>
          )}
          {trend === "down" && (
            <>
              <TrendingDown className="h-4 w-4 text-destructive mr-1" />
              <span className="text-destructive font-medium">Declining</span>
            </>
          )}
          {trend === "stable" && (
            <span className="text-muted-foreground font-medium">Stable</span>
          )}
        </motion.div>
      )}
    </div>
  );
};