"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletConnection } from "@/components/blockchain/wallet-connection";
import { MetaMaskGuide } from "@/components/blockchain/metamask-guide";
import { Info, Wallet, Code, TestTube } from 'lucide-react';

export default function WalletTestingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Wallet Connection Testing</h1>
          <p className="text-muted-foreground">
            Test blockchain wallet connectivity and learn about MetaMask setup
          </p>
        </div>

        {/* Quick Solutions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Quick Solutions for MetaMask Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <div>
              <strong>Option 1:</strong> Install MetaMask browser extension (recommended for production use)
            </div>
            <div>
              <strong>Option 2:</strong> Use Demo Mode to test the application without MetaMask
            </div>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="guide" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guide">MetaMask Guide</TabsTrigger>
            <TabsTrigger value="test">Test Connection</TabsTrigger>
            <TabsTrigger value="demo">Demo Features</TabsTrigger>
          </TabsList>

          <TabsContent value="guide">
            <MetaMaskGuide />
          </TabsContent>

          <TabsContent value="test">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Live Wallet Connection Test
                  </CardTitle>
                  <CardDescription>
                    Test your wallet connection in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WalletConnection 
                    onWalletConnected={(address, provider) => {
                      console.log('Test connection successful:', address);
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Status Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Error</Badge>
                        <span className="font-medium">MetaMask Not Installed</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Browser extension not found. Install from metamask.io
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Demo</Badge>
                        <span className="font-medium">Mock Connection</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Simulated wallet for testing application features
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>Connected</Badge>
                        <span className="font-medium">Real Wallet</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Actual MetaMask wallet connected and ready
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Pending</Badge>
                        <span className="font-medium">User Action Required</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Waiting for user to confirm in MetaMask popup
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="demo">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Demo Mode Features
                  </CardTitle>
                  <CardDescription>
                    What you can test without MetaMask
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="font-medium">✅ Available in Demo Mode:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• User registration flow</li>
                        <li>• Interface navigation</li>
                        <li>• Form submissions</li>
                        <li>• Mock wallet address display</li>
                        <li>• Basic app functionality</li>
                        <li>• Geofencing features</li>
                        <li>• Map interactions</li>
                        <li>• Tourist interface</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">❌ Requires Real MetaMask:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Actual blockchain transactions</li>
                        <li>• Digital signature verification</li>
                        <li>• Real wallet balance checks</li>
                        <li>• Smart contract interactions</li>
                        <li>• Production-ready security</li>
                        <li>• Cryptographic operations</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Technical Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <div className="text-muted-foreground mb-2">Demo wallet address:</div>
                    <div className="break-all">0x1234567890123456789012345678901234567890</div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Error Details:</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <code className="text-sm text-red-800">
                        Error: MetaMask is not installed. Please install MetaMask to continue.
                      </code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This error occurs when <code>window.ethereum</code> is undefined, 
                      which means no Ethereum wallet provider is detected in the browser.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Development vs Production</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-600">Development/Testing</h4>
                      <p className="text-sm text-muted-foreground">
                        Demo mode is perfect for development, UI testing, and showcasing 
                        application features without requiring users to install MetaMask.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-600">Production</h4>
                      <p className="text-sm text-muted-foreground">
                        Real MetaMask connection provides actual blockchain security, 
                        transaction signing, and user identity verification.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button asChild className="flex-1">
            <a href="/geofencing">
              Test Geofencing System
            </a>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <a href="/auth/tourist/register">
              Try Registration Flow
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
