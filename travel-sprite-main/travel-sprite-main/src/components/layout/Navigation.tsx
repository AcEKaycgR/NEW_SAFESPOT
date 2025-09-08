import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  Map, 
  Calendar, 
  CreditCard, 
  Bell, 
  User,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: Map, label: "Map" },
  { to: "/itinerary", icon: Calendar, label: "Itinerary" },
  { to: "/id", icon: CreditCard, label: "ID" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
];

const mobileNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: Map, label: "Map" },
  { to: "/assistant", icon: Calendar, label: "Assistant" },
  { to: "/id", icon: CreditCard, label: "ID" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
];

export const DesktopNavigation = () => {
  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">TS</span>
          </div>
          <span className="font-display font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
            SafeYatra
          </span>
        </motion.div>
        
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        
        <MobileMenuButton />
      </div>
    </motion.header>
  );
};

export const MobileNavigation = () => {
  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/80 backdrop-blur-md safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => (
          <MobileNavItem key={item.to} {...item} />
        ))}
      </div>
    </motion.nav>
  );
};

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  return (
    <NavLink to={to} end>
      {({ isActive }) => (
        <motion.div
          className={cn(
            "relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-normal",
            isActive 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          {isActive && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </motion.div>
      )}
    </NavLink>
  );
};

const MobileNavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  return (
    <NavLink to={to} end>
      {({ isActive }) => (
        <motion.div
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-lg min-w-[3rem] transition-all duration-normal",
            isActive 
              ? "text-primary" 
              : "text-muted-foreground"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className={cn(
              "p-2 rounded-lg transition-all duration-normal",
              isActive ? "bg-primary/10" : "hover:bg-accent/50"
            )}
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <span className="text-xs font-medium mt-1">{label}</span>
        </motion.div>
      )}
    </NavLink>
  );
};

const MobileMenuButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="md:hidden">
      <motion.button
        className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.div>
      </motion.button>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute top-16 right-4 bg-background border rounded-lg shadow-lg p-2 min-w-[200px]"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </motion.div>
      )}
    </div>
  );
};