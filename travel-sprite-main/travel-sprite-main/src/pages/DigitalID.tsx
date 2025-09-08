import { motion } from "framer-motion";
import { useState } from "react";
import { QrCode, Share2, Download, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const DigitalID = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const userInfo = {
    name: "Arjun Patel",
    id: "SY2024789456",
    nationality: "Indian",
    passportNo: "K8765432",
    emergencyContact: "+91 98765 12345",
    bloodGroup: "A+",
    allergies: "None",
    medicalInfo: "Diabetic - Type 2",
    avatar: "/placeholder.svg",
    qrData: "safeyatra://verify/SY2024789456"
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SafeYatra Digital ID',
          text: `Verification ID: ${userInfo.id}`,
          url: userInfo.qrData
        });
        toast({
          title: "Shared successfully",
          description: "Your digital ID has been shared."
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userInfo.qrData);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Digital ID link has been copied."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Digital Travel ID
          </h1>
          <p className="text-muted-foreground">Your secure travel identification</p>
        </div>

        {/* ID Card */}
        <div className="perspective-1000">
          <motion.div
            className="relative w-full h-80 cursor-pointer preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onClick={handleFlip}
          >
            {/* Front of Card */}
            <motion.div
              className="absolute inset-0 backface-hidden"
              whileHover={{ scale: 1.02 }}
            >
              <Card className="h-full bg-gradient-primary text-white overflow-hidden relative">
                {/* Glossy sheen effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 -skew-x-12 w-20"
                  animate={{ x: [-100, 400] }}
                  transition={{ 
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                />
                
                <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
                  {/* Header */}
                  <div className="text-center">
                    <div className="text-sm opacity-90 mb-1">SAFEYATRA</div>
                    <div className="text-xs opacity-75">DIGITAL TRAVEL ID</div>
                  </div>

                  {/* Profile Section */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16 border-2 border-white/30">
                      <AvatarImage src={userInfo.avatar} />
                      <AvatarFallback className="bg-white/20 text-white text-lg">
                        {userInfo.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="font-display font-bold text-lg">{userInfo.name}</h2>
                      <p className="text-sm opacity-90">{userInfo.nationality}</p>
                      <p className="text-xs opacity-75 font-mono">ID: {userInfo.id}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-between items-center">
                    <Badge className="bg-white/20 text-white border-white/30">
                      ✓ Verified Traveler
                    </Badge>
                    <div className="text-xs opacity-75">
                      Tap to flip
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Back of Card */}
            <motion.div
              className="absolute inset-0 backface-hidden rotate-y-180"
              whileHover={{ scale: 1.02 }}
            >
              <Card className="h-full bg-gradient-secondary text-white">
                <CardContent className="p-6 h-full">
                  <div className="space-y-4">
                    <div className="text-center text-sm opacity-90 mb-4">
                      EMERGENCY INFORMATION
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="opacity-75">Blood Group:</span>
                        <span className="font-semibold">{userInfo.bloodGroup}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="opacity-75">Allergies:</span>
                        <span className="font-semibold">{userInfo.allergies}</span>
                      </div>
                      
                      <div>
                        <div className="opacity-75 mb-1">Medical Info:</div>
                        <div className="font-semibold text-xs">{userInfo.medicalInfo}</div>
                      </div>
                      
                      <div>
                        <div className="opacity-75 mb-1">Emergency Contact:</div>
                        <div className="font-semibold font-mono text-xs">{userInfo.emergencyContact}</div>
                      </div>
                      
                      <div>
                        <div className="opacity-75 mb-1">Passport:</div>
                        <div className="font-semibold font-mono text-xs">{userInfo.passportNo}</div>
                      </div>
                    </div>
                    
                    <div className="text-center text-xs opacity-75 mt-4 pt-4 border-t border-white/20">
                      Valid for SafeYatra Services
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setShowQR(!showQR)}
            >
              {showQR ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showQR ? "Hide QR" : "Show QR"}
            </Button>
            
            <Button variant="outline" className="flex-1" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* QR Code Section */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: showQR ? "auto" : 0, 
              opacity: showQR ? 1 : 0 
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="p-6 text-center bg-gradient-surface">
              <div className="space-y-4">
                <div className="w-40 h-40 mx-auto bg-white rounded-lg p-4 flex items-center justify-center">
                  <QrCode className="h-32 w-32 text-foreground" />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Scan to verify identity
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {userInfo.qrData}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <Button className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download as PDF
          </Button>
        </div>

        {/* Security Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-teal/10 rounded-full">
                <QrCode className="h-4 w-4 text-brand-teal" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Secure & Verified</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your digital ID is encrypted and can only be verified by authorized SafeYatra partners and emergency services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DigitalID;