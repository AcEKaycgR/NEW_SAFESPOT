import { motion } from "framer-motion";
import { ArrowRight, MapPin, Shield, Compass, Camera, Users, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/india-travel-hero.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const floatingIcons = [
    { icon: Shield, delay: 0, x: "10%", y: "20%", color: "text-brand-teal" },
    { icon: MapPin, delay: 0.5, x: "85%", y: "25%", color: "text-brand-emerald" },
    { icon: Camera, delay: 1, x: "15%", y: "60%", color: "text-brand-forest" },
    { icon: Compass, delay: 1.5, x: "80%", y: "65%", color: "text-brand-teal" },
    { icon: Users, delay: 2, x: "90%", y: "40%", color: "text-brand-emerald" },
    { icon: Bell, delay: 2.5, x: "20%", y: "80%", color: "text-brand-sage" },
  ];

  const features = [
    {
      title: "Real-time Safety Insights",
      description: "Get live safety scores and alerts for any location in India",
      icon: Shield,
    },
    {
      title: "Smart Itineraries", 
      description: "AI-powered travel planning for incredible India experiences",
      icon: MapPin,
    },
    {
      title: "Emergency Support",
      description: "24/7 assistance and trusted contact network",
      icon: Bell,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        
        {/* Hero Image */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Beautiful India travel destinations" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingIcons.map((element, index) => (
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
                opacity: 0.8, 
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
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <element.icon className={`h-6 w-6 ${element.color}`} />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-5xl mx-auto">
            {/* Logo and Brand */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-8"
            >
              <div className="flex items-center justify-center mb-6">
                <motion.div 
                  className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mr-6 shadow-glow"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <MapPin className="h-10 w-10 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-2">
                    SafeYatra
                  </h1>
                  <div className="flex items-center justify-center text-white/80">
                    <Sparkles className="h-5 w-5 mr-2" />
                    <span className="font-body text-xl">Your India Travel Companion</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Hero Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="mb-12"
            >
              <h2 className="text-6xl md:text-8xl font-display font-bold text-white mb-6 leading-tight">
                Explore India,{" "}
                <span className="bg-gradient-to-r from-brand-teal to-brand-emerald bg-clip-text text-transparent">
                  Stay Safe
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-white/90 font-body max-w-3xl mx-auto leading-relaxed">
                Discover the incredible diversity of India with confidence. Get real-time safety insights, 
                smart itineraries, and local guidance for your unforgettable journey.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  size="xl" 
                  onClick={() => navigate("/dashboard")}
                  className="group bg-brand-teal hover:bg-brand-emerald text-white font-semibold px-8 py-4 rounded-full shadow-brand"
                >
                  Start Your Adventure
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  size="xl" 
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-4 rounded-full"
                >
                  Sign In
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/60 text-center cursor-pointer"
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
            </div>
            <p className="text-xs mt-2 font-body">Scroll to explore</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-surface">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Why Choose SafeYatra?
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by AI and local insights to make your India journey safe and memorable
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-card rounded-2xl p-8 border shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-display font-semibold text-card-foreground mb-4">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-gradient-primary relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to Explore India Safely?
            </h3>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who trust SafeYatra for their Indian adventures
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="xl"
                onClick={() => navigate("/dashboard")}
                className="bg-white text-brand-teal hover:bg-white/90 font-semibold px-12 py-4 rounded-full shadow-lg"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;