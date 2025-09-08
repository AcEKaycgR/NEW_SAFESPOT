"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle, AlertCircle, Loader2, User, Database } from "lucide-react";
import { ethers } from "ethers";
import { useApiIntegration, blockchainService } from '@/lib/api-integration';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectionProps {
  onWalletConnected?: (address: string, provider: ethers.BrowserProvider, userStatus?: any) => void;
  onRegistrationNeeded?: (address: string, provider: ethers.BrowserProvider) => void;
}

export function WalletConnection({ onWalletConnected }: WalletConnectionProps) {
  const [walletStatus, setWalletStatus] = React.useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [walletAddress, setWalletAddress] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [provider, setProvider] = React.useState<ethers.BrowserProvider | null>(null);

  const connectWallet = async () => {
    try {
      setWalletStatus("connecting");
      setErrorMessage("");

      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        setWalletStatus("error");
        setErrorMessage("MetaMask is not installed. Please install MetaMask browser extension to continue with wallet connection.");
        return;
      }

      // Create a new provider
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await newProvider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found. Please make sure you're logged into MetaMask.");
      }

      const address = accounts[0];
      setWalletAddress(address);
      setProvider(newProvider);
      setWalletStatus("connected");
      
      // Call the callback if provided
      if (onWalletConnected) {
        onWalletConnected(address, newProvider);
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setErrorMessage(error.message || "Failed to connect wallet");
      setWalletStatus("error");
    }
  };

  const simulateWalletConnection = () => {
    // For testing purposes without MetaMask
    const mockAddress = "0x1234567890123456789012345678901234567890";
    setWalletAddress(mockAddress);
    setWalletStatus("connected");
    
    if (onWalletConnected) {
      onWalletConnected(mockAddress, null as any);
    }
  };

  const disconnectWallet = () => {
    setWalletStatus("disconnected");
    setWalletAddress("");
    setProvider(null);
    setErrorMessage("");
  };

  const getShortAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Blockchain Wallet Connection
        </CardTitle>
        <CardDescription>
          Connect your wallet to create and verify your digital ID on the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        {walletStatus === "disconnected" && (
          <div className="flex flex-col items-center gap-4">
            <Button onClick={connectWallet} className="w-full">
              <Wallet className="mr-2 h-4 w-4" />
              Connect MetaMask Wallet
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              You'll need to sign a message to verify your identity on the blockchain
            </p>
            
            {/* Demo mode for testing without MetaMask */}
            <div className="w-full border-t pt-4">
              <p className="text-xs text-muted-foreground text-center mb-2">
                For testing without MetaMask:
              </p>
              <Button 
                onClick={simulateWalletConnection} 
                variant="outline" 
                className="w-full"
                size="sm"
              >
                Demo Mode (Mock Wallet)
              </Button>
            </div>
          </div>
        )}

        {walletStatus === "connecting" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Connecting to your wallet... Please confirm in MetaMask
            </p>
          </div>
        )}

        {walletStatus === "connected" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Wallet Connected</span>
              </div>
              <Badge variant="secondary">MetaMask</Badge>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Connected Address</p>
              <p className="font-mono text-sm">{getShortAddress(walletAddress)}</p>
            </div>
            
            <Button onClick={disconnectWallet} variant="outline">
              Disconnect Wallet
            </Button>
          </div>
        )}

        {walletStatus === "error" && (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive text-center">{errorMessage}</p>
            
            {errorMessage.includes("MetaMask is not installed") && (
              <div className="w-full space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Install MetaMask:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Visit <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline">metamask.io</a></li>
                    <li>2. Download the browser extension</li>
                    <li>3. Create a wallet or import existing</li>
                    <li>4. Return here to connect</li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={connectWallet} variant="outline" className="w-full">
                    Try Again
                  </Button>
                  <Button 
                    onClick={simulateWalletConnection} 
                    variant="secondary" 
                    className="w-full"
                  >
                    Continue with Demo Mode
                  </Button>
                </div>
              </div>
            )}
            
            {!errorMessage.includes("MetaMask is not installed") && (
              <Button onClick={connectWallet} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}