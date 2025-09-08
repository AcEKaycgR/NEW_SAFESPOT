"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle, AlertCircle, Loader2, User, Database } from "lucide-react";
import { ethers } from "ethers";
import { useApiIntegration, blockchainService } from '@/lib/api-integration';

interface WalletConnectionProps {
  onWalletConnected?: (address: string, provider: ethers.BrowserProvider, userStatus?: any) => void;
  onRegistrationNeeded?: (address: string, provider: ethers.BrowserProvider) => void;
}

export function WalletConnection({ onWalletConnected, onRegistrationNeeded }: WalletConnectionProps) {
  const [walletStatus, setWalletStatus] = React.useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [walletAddress, setWalletAddress] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [provider, setProvider] = React.useState<ethers.BrowserProvider | null>(null);
  const [userStatus, setUserStatus] = React.useState<{
    userExists: boolean;
    blockchainRegistered: boolean;
    user?: any;
    blockchainData?: any;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);

  const { handleApiError, handleApiSuccess } = useApiIntegration();

  React.useEffect(() => {
    // Check for existing connection on mount
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await newProvider.listAccounts();
        
        if (accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          setProvider(newProvider);
          setWalletStatus("connected");
          
          // Check user status with backend
          await checkUserStatus(address, newProvider);
        }
      }
    } catch (error) {
      console.error("Error checking existing connection:", error);
    }
  };

  const checkUserStatus = async (address: string, walletProvider: ethers.BrowserProvider) => {
    setIsCheckingStatus(true);
    try {
      const status = await blockchainService.checkUserStatus(address);
      setUserStatus(status);
      
      if (onWalletConnected) {
        onWalletConnected(address, walletProvider, status);
      }
      
      // If user doesn't exist in either database or blockchain, trigger registration
      if (!status.userExists && !status.blockchainRegistered && onRegistrationNeeded) {
        onRegistrationNeeded(address, walletProvider);
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      handleApiError(error as Error, "Checking user registration status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const connectWallet = async () => {
    try {
      setWalletStatus("connecting");
      setErrorMessage("");

      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
      }

      // Create a new provider
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await newProvider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found. Please make sure you're logged into MetaMask.");
      }

      const address = accounts[0];
      
      // Sign a message to verify wallet ownership
      const signer = newProvider.getSigner();
      const message = `Connect to SafeSpot Tourist Platform\nTimestamp: ${Date.now()}\nAddress: ${address}`;
      const signature = await signer.signMessage(message);
      
      // Connect to backend
      try {
        await blockchainService.api.connectWallet(address, signature);
        handleApiSuccess("Wallet connected successfully!");
      } catch (backendError) {
        console.warn("Backend connection failed, but wallet connected locally:", backendError);
      }
      
      setWalletAddress(address);
      setProvider(newProvider);
      setWalletStatus("connected");
      
      // Check user status
      await checkUserStatus(address, newProvider);
      
    } catch (error: any) {
      setWalletStatus("error");
      const message = error?.message || "Failed to connect wallet";
      setErrorMessage(message);
      handleApiError(error, "Connecting wallet");
    }
  };

  const disconnectWallet = () => {
    setWalletStatus("disconnected");
    setWalletAddress("");
    setProvider(null);
    setUserStatus(null);
    setErrorMessage("");
    handleApiSuccess("Wallet disconnected");
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getStatusBadge = () => {
    if (!userStatus) return null;

    if (userStatus.userExists && userStatus.blockchainRegistered) {
      return <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Fully Registered
      </Badge>;
    } else if (userStatus.userExists) {
      return <Badge variant="secondary">
        <Database className="w-3 h-3 mr-1" />
        Database Only
      </Badge>;
    } else if (userStatus.blockchainRegistered) {
      return <Badge variant="secondary">
        <Wallet className="w-3 h-3 mr-1" />
        Blockchain Only
      </Badge>;
    } else {
      return <Badge variant="outline">
        <AlertCircle className="w-3 h-3 mr-1" />
        Not Registered
      </Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (walletStatus) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "connecting":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Wallet Connection
        </CardTitle>
        <CardDescription>
          {walletStatus === "connected" 
            ? "Your wallet is connected to SafeSpot" 
            : "Connect your MetaMask wallet to access SafeSpot features"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {walletStatus === "connected" ? (
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-600">Wallet Address</span>
                {userStatus && getStatusBadge()}
              </div>
              <p className="font-mono text-sm break-all">{formatAddress(walletAddress)}</p>
            </div>
            
            {isCheckingStatus && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking registration status...</span>
              </div>
            )}
            
            {userStatus && !isCheckingStatus && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Registration Status</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Database Registration:</span>
                    <span className={userStatus.userExists ? "text-green-600" : "text-red-600"}>
                      {userStatus.userExists ? "✓ Registered" : "✗ Not Registered"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blockchain Registration:</span>
                    <span className={userStatus.blockchainRegistered ? "text-green-600" : "text-red-600"}>
                      {userStatus.blockchainRegistered ? "✓ Registered" : "✗ Not Registered"}
                    </span>
                  </div>
                  
                  {userStatus.user && (
                    <div className="pt-2 border-t border-gray-200">
                      <p><strong>Name:</strong> {userStatus.user.name}</p>
                      <p><strong>Email:</strong> {userStatus.user.email}</p>
                      <p><strong>Status:</strong> {userStatus.user.verification_status}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button 
              onClick={disconnectWallet}
              variant="outline" 
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <Button 
            onClick={connectWallet}
            disabled={walletStatus === "connecting"}
            className="w-full"
          >
            {walletStatus === "connecting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect MetaMask
              </>
            )}
          </Button>
        )}

        {typeof window !== "undefined" && typeof window.ethereum === "undefined" && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Don't have MetaMask?</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open("https://metamask.io/download/", "_blank")}
            >
              Install MetaMask
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
