"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Download, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export function MetaMaskGuide() {
  const [hasMetaMask, setHasMetaMask] = React.useState<boolean | null>(null);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    // Check for MetaMask
    const checkMetaMask = () => {
      setHasMetaMask(typeof window.ethereum !== 'undefined');
      setIsChecking(false);
    };

    // Check immediately and after a short delay to ensure window.ethereum is loaded
    checkMetaMask();
    const timeout = setTimeout(checkMetaMask, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const recheckMetaMask = () => {
    setIsChecking(true);
    setTimeout(() => {
      setHasMetaMask(typeof window.ethereum !== 'undefined');
      setIsChecking(false);
    }, 500);
  };

  if (isChecking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Checking for MetaMask...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasMetaMask ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          )}
          MetaMask Wallet Setup
        </CardTitle>
        <CardDescription>
          {hasMetaMask 
            ? "MetaMask is installed and ready to use"
            : "MetaMask wallet extension is required for blockchain features"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasMetaMask ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>MetaMask Detected!</AlertTitle>
            <AlertDescription>
              You can now connect your wallet to access blockchain features.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>MetaMask Not Found</AlertTitle>
              <AlertDescription>
                MetaMask is a browser extension that allows you to interact with blockchain applications securely.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-semibold">Installation Steps:</h4>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 min-w-[20px] justify-center">1</Badge>
                  <div>
                    <div className="font-medium">Visit MetaMask website</div>
                    <div className="text-muted-foreground">Go to metamask.io to download the extension</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 min-w-[20px] justify-center">2</Badge>
                  <div>
                    <div className="font-medium">Install browser extension</div>
                    <div className="text-muted-foreground">Available for Chrome, Firefox, Brave, and Edge</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 min-w-[20px] justify-center">3</Badge>
                  <div>
                    <div className="font-medium">Create or import wallet</div>
                    <div className="text-muted-foreground">Set up a new wallet or import existing one</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 min-w-[20px] justify-center">4</Badge>
                  <div>
                    <div className="font-medium">Return and refresh this page</div>
                    <div className="text-muted-foreground">Come back here to connect your wallet</div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="flex-1">
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download MetaMask
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button onClick={recheckMetaMask} variant="outline" className="flex-1">
                Check Again
              </Button>
            </div>
          </div>
        )}

        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium mb-2">Alternative: Demo Mode</h4>
          <p className="text-sm text-muted-foreground">
            If you prefer to test the application without installing MetaMask, 
            you can use Demo Mode which simulates wallet connectivity for testing purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
