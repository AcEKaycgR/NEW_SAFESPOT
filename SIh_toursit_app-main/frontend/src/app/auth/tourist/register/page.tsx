"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { StepIndicator } from "@/components/safespot/step-indicator";
import { useStep } from "@/hooks/use-step";
import { ArrowRight, KeyRound, User, Check, Calendar, Wallet, Eye, EyeOff, Mail } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from 'next/navigation';
import { DatePicker } from "@/components/safespot/date-picker";
import { CountryCodeSelector } from "@/components/safespot/country-code-selector";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WalletConnection } from "@/components/blockchain/wallet-connection";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";

type UserType = 'new' | 'returning';

function Step1({ onNext, userType, setUserType }: { 
  onNext: () => void; 
  userType: UserType;
  setUserType: (type: UserType) => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (userType === 'returning') {
      if (!email) {
        toast({
          title: "Email Required",
          description: "Please enter your email address to continue.",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      try {
        // Here we would normally check if the user exists in our system
        // For now, we'll simulate a check and proceed
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        toast({
          title: "Email Found",
          description: "Please connect your wallet to continue.",
        });
        onNext();
      } catch (error) {
        toast({
          title: "User Not Found",
          description: "No account found with this email. Please register as a new user.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <CardHeader className="text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <User className="h-8 w-8 text-primary" />
        </motion.div>
        <CardTitle className="text-2xl">Welcome to SafeSpot</CardTitle>
        <CardDescription>
          Let's get you set up. Are you a new or returning tourist?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={userType} 
          onValueChange={(value: string) => setUserType(value as UserType)}
          className="space-y-4"
        >
          <motion.label 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-4 rounded-xl border p-4 hover:bg-accent has-[:checked]:border-primary transition-all"
          >
            <RadioGroupItem value="new" id="new" />
            <div>
              <p className="font-medium">I'm a new tourist</p>
              <p className="text-sm text-muted-foreground">
                Create a new profile and Digital ID.
              </p>
            </div>
          </motion.label>
          <motion.label 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-4 rounded-xl border p-4 hover:bg-accent has-[:checked]:border-primary transition-all"
          >
            <RadioGroupItem value="returning" id="returning" />
            <div>
              <p className="font-medium">I'm a returning tourist</p>
              <p className="text-sm text-muted-foreground">
                Log in with your existing credentials.
              </p>
            </div>
          </motion.label>
        </RadioGroup>

        {userType === 'returning' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="mt-6 space-y-4 rounded-lg border bg-muted/50 p-4"
          >
            <h3 className="font-medium">Returning Tourist Login</h3>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll verify your identity using your connected wallet after you enter your email.
            </p>
          </motion.div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5"
            >
              <Check className="h-5 w-5" />
            </motion.div>
          ) : (
            <>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </motion.div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  const [documentType, setDocumentType] = useState<'aadhaar' | 'passport'>('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const handleNext = () => {
    // Validate required fields based on document type
    if (documentType === 'aadhaar') {
      if (!aadhaarNumber || !fullName || !dob || !address || !phone) {
        alert('Please fill in all Aadhaar details');
        return;
      }
    } else {
      if (!passportNumber || !nationality || !fullName || !dob || !address || !phone) {
        alert('Please fill in all Passport details');
        return;
      }
    }
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <CardHeader className="text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Calendar className="h-8 w-8 text-primary" />
        </motion.div>
        <CardTitle>Personal Information & KYC</CardTitle>
        <CardDescription>
          Please provide your personal details and identity verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Type Selection */}
        <div className="space-y-2">
          <Label>Identity Document Type</Label>
          <RadioGroup 
            value={documentType} 
            onValueChange={(value: string) => setDocumentType(value as 'aadhaar' | 'passport')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="aadhaar" id="aadhaar" />
              <Label htmlFor="aadhaar">Aadhaar (Indian Citizens)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="passport" id="passport" />
              <Label htmlFor="passport">Passport (International Visitors)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Common Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDob(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <textarea
            id="address"
            className="w-full p-3 border rounded-lg bg-background"
            value={address}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)}
            placeholder="Enter your complete address"
            rows={3}
            required
          />
        </div>

        {/* Conditional Document Fields */}
        {documentType === 'aadhaar' ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <Label htmlFor="aadhaar">Aadhaar Number</Label>
            <Input
              id="aadhaar"
              value={aadhaarNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAadhaarNumber(e.target.value)}
              placeholder="XXXX XXXX XXXX"
              maxLength={12}
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter your 12-digit Aadhaar number for verification
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-2">
              <Label htmlFor="passport">Passport Number</Label>
              <Input
                id="passport"
                value={passportNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassportNumber(e.target.value)}
                placeholder="A1234567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={nationality}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNationality(e.target.value)}
                placeholder="Country of citizenship"
                required
              />
            </div>
          </motion.div>
        )}

        <Button onClick={handleNext} className="w-full">
          Continue to Wallet Connection
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </motion.div>
  );
}

function Step3() {
  const [walletConnected, setWalletConnected] = useState(false);
  const router = useRouter();

  const handleWalletConnected = (address: string, provider: ethers.BrowserProvider) => {
    setWalletConnected(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <CardHeader className="text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Wallet className="h-8 w-8 text-primary" />
        </motion.div>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          Connect your wallet to create your blockchain-based Digital ID.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <WalletConnection onWalletConnected={handleWalletConnected} />
        
        {walletConnected && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-lg border p-4 bg-green-50/50 border-green-200"
          >
            <h3 className="font-medium mb-2 flex items-center">
              <Check className="h-5 w-5 text-green-600 mr-2" />
              Wallet Connected Successfully!
            </h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                Your Digital ID will be created on the blockchain
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                A QR code will be generated for verification
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                Your profile will be ready to use
              </li>
            </ul>
          </motion.div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => router.push('/dashboard')}
          disabled={!walletConnected}
        >
          {walletConnected ? (
            <>
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            "Connect Wallet to Continue"
          )}
        </Button>
      </CardFooter>
    </motion.div>
  );
}

export default function TouristRegisterPage() {
  const steps = [
    { icon: User, label: "Getting Started" },
    { icon: Calendar, label: "Personal Info" },
    { icon: Wallet, label: "Wallet Connection" },
  ];

  const { currentStep, nextStep, goToStep, isLastStep } = useStep(steps.length);
  const [userType, setUserType] = useState<UserType>('new');
  
  // Pass userType state to Step1
  const getStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <Step1 onNext={nextStep} userType={userType} setUserType={setUserType} />;
      case 2:
        return <Step2 onNext={nextStep} />;
      case 3:
        return <Step3 />;
      default:
        return <Step1 onNext={nextStep} userType={userType} setUserType={setUserType} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header with animations */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="inline-block text-6xl mb-4"
          >
            🌍
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">
            Safe Journey Starts Here
          </h1>
          <p className="text-muted-foreground mt-2">
            Create your secure travel profile in just a few steps
          </p>
        </motion.div>

        {/* Step indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StepIndicator steps={steps} currentStep={currentStep} />
        </motion.div>

        {/* Card with step content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
            {getStepComponent()}
          </Card>
        </motion.div>

        {/* Footer link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground"
        >
          Are you an authority?{" "}
          <Link href="/auth/login" className="underline text-primary hover:text-primary/80">
            Login here
          </Link>
          .
        </motion.p>
      </div>
    </div>
  );
}