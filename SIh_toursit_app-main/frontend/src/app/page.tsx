"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Shield, Compass, Camera, Users, Bell, Sparkles, UserCheck, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import heroImage from "@/assets/india-travel-hero.jpg";
import Image from "next/image";

export default function LandingPage() {
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Check if we're in development mode (client-side only)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost');
    setIsDevelopment(isLocalhost);
  }, []);

  const floatingIcons = [
    { icon: Shield, delay: 0, x: "10%", y: "20%", color: "text-primary" },
    { icon: MapPin, delay: 0.5, x: "85%", y: "25%", color: "text-accent" },
    { icon: Camera, delay: 1, x: "15%", y: "60%", color: "text-primary" },
    { icon: Compass, delay: 1.5, x: "80%", y: "65%", color: "text-accent" },
    { icon: Users, delay: 2, x: "90%", y: "40%", color: "text-primary" },
    { icon: Bell, delay: 2.5, x: "20%", y: "80%", color: "text-muted-foreground" },
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
    {
      title: "Privacy First",
      description: "You control your data. Share location only when you want, for as long as you want.",
      icon: Lock,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-90" />
        
        {/* Hero Image */}
        <div className="absolute inset-0">
          <Image 
            src={heroImage} 
            alt="Beautiful India travel destinations" 
            fill
            className="w-full h-full object-cover"
            priority
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
                  className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mr-6 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-2">
                    SafeSpot
                  </h1>
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Sparkles className="h-5 w-5 mr-2" />
                    <span className="text-xl">Your India Travel Companion</span>
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
              <h2 className="text-6xl md:text-8xl font-bold text-foreground mb-6 leading-tight">
                Explore India,{` `}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Stay Safe
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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
                  size="lg" 
                  asChild
                  className="group bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-full shadow-lg"
                >
                  <Link href="/auth/tourist/register">
                    Tourist Login
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  asChild
                  className="bg-white/10 border-border text-foreground hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-4 rounded-full"
                >
                  <Link href="/auth/login">
                    Authority Login
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Developer Bypass Buttons - Only in Development */}
            {(isDevelopment || true) && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5">
                <span className="text-xs font-medium text-yellow-800">DEV:</span>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard">Tourist Dashboard</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              </div>
            )}
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
            className="text-muted-foreground text-center cursor-pointer"
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"></div>
            </div>
            <p className="text-xs mt-2">Scroll to explore</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why Choose SafeSpot?
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by AI and local insights to make your India journey safe and memorable
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
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
                <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h4 className="text-2xl font-semibold text-card-foreground mb-4">
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
      <section className="py-24 bg-gradient-to-r from-primary to-accent relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Explore India Safely?
            </h3>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who trust SafeSpot for their Indian adventures
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                asChild
                className="bg-white text-primary hover:bg-white/90 font-semibold px-12 py-4 rounded-full shadow-lg"
              >
                <Link href="/auth/tourist/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
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

      <footer className="border-t p-6 text-center text-sm text-muted-foreground md:px-8">
        © {new Date().getFullYear()} SafeSpot. Your safety, our priority.
      </footer>
    </div>
  );
}