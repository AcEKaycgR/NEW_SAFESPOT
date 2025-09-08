import { motion } from "framer-motion";
import { 
  Shield, 
  MapPin, 
  Camera, 
  Plane, 
  Heart,
  Star,
  Navigation
} from "lucide-react";

const floatingElements = [
  { icon: Shield, delay: 0, x: "10%", y: "20%" },
  { icon: MapPin, delay: 0.5, x: "80%", y: "15%" },
  { icon: Camera, delay: 1, x: "15%", y: "70%" },
  { icon: Plane, delay: 1.5, x: "75%", y: "65%" },
  { icon: Heart, delay: 2, x: "50%", y: "10%" },
  { icon: Star, delay: 2.5, x: "90%", y: "40%" },
  { icon: Navigation, delay: 3, x: "20%", y: "45%" },
];

export const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            left: element.x,
            top: element.y,
          }}
          initial={{ 
            opacity: 0, 
            scale: 0,
            rotate: -180,
          }}
          animate={{ 
            opacity: 0.6, 
            scale: 1,
            rotate: 0,
            y: [0, -20, 0],
          }}
          transition={{
            delay: element.delay,
            duration: 1,
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <element.icon className="h-6 w-6 text-white" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};