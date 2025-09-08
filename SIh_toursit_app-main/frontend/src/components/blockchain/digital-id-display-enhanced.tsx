"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, User, Copy, Download, Shield, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import QRCode from "qrcode.react";
import { useApiIntegration, blockchainService, type UserData, type DigitalIdData } from '@/lib/api-integration';

interface DigitalIDDisplayEnhancedProps {
  userAddress?: string;
  userId?: number;
  onGenerateDigitalId?: (digitalId: DigitalIdData) => void;
  autoLoad?: boolean;
}

export function DigitalIDDisplayEnhanced({ 
  userAddress, 
  userId,
  onGenerateDigitalId,
  autoLoad = true
}: DigitalIDDisplayEnhancedProps) {
  const [user, setUser] = React.useState<UserData | null>(null);
  const [digitalId, setDigitalId] = React.useState<DigitalIdData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [copied, setCopied] = React.useState<'address' | 'data' | null>(null);

  const { handleApiError, handleApiSuccess } = useApiIntegration();

  React.useEffect(() => {
    if (autoLoad && (userAddress || userId)) {
      loadUserData();
    }
  }, [userAddress, userId, autoLoad]);

  const loadUserData = async () => {
    if (!userAddress && !userId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      let userData: UserData;
      
      if (userAddress) {
        userData = await blockchainService.api.getUserByAddress(userAddress);
      } else if (userId) {
        // If we only have userId, we need to find the user differently
        // For now, we'll skip this case
        setError('Loading by user ID not yet supported');
        return;
      } else {
        return;
      }
      
      setUser(userData);
      
      // Try to load existing digital ID if user is verified
      if (userData.verification_status === 'VERIFIED') {
        await loadDigitalId(userData.id);
      }
      
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load user data';
      setError(errorMsg);
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDigitalId = async (userIdToLoad: number) => {
    try {
      // Note: We'd need a new API endpoint to get digital ID by user ID
      // For now, we'll just simulate this
      console.log('Would load digital ID for user:', userIdToLoad);
    } catch (error) {
      console.error('Error loading digital ID:', error);
    }
  };

  const generateDigitalId = async () => {
    if (!user || !userAddress) {
      handleApiError(new Error('User data or address not available'), 'Generating digital ID');
      return;
    }

    if (user.verification_status !== 'VERIFIED') {
      handleApiError(new Error('User must be verified before generating digital ID'), 'Generating digital ID');
      return;
    }

    setIsGenerating(true);
    try {
      const newDigitalId = await blockchainService.generateDigitalIdentity(user.id, userAddress);
      setDigitalId(newDigitalId);
      
      if (onGenerateDigitalId) {
        onGenerateDigitalId(newDigitalId);
      }
      
      handleApiSuccess('Digital ID generated successfully!');
    } catch (error: any) {
      handleApiError(error, 'Generating digital ID');
    } finally {
      setIsGenerating(false);
    }
  };

  const verifyDigitalId = async () => {
    if (!digitalId?.blockchain_hash) return;
    
    try {
      const verification = await blockchainService.verifyTouristIdentity(digitalId.blockchain_hash);
      
      if (verification.isValid) {
        handleApiSuccess('Digital ID is valid and verified!');
      } else {
        handleApiError(new Error(verification.reason || 'Digital ID verification failed'), 'Verifying digital ID');
      }
    } catch (error: any) {
      handleApiError(error, 'Verifying digital ID');
    }
  };

  const getShortAddress = (address: string) => {
    if (!address || address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = async (text: string, type: 'address' | 'data') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('#digital-id-qr canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL();
      const link = document.createElement('a');
      link.download = `digital-id-${user?.name || 'user'}-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  const getVerificationBadge = () => {
    if (!user) return null;
    
    switch (user.verification_status) {
      case 'VERIFIED':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDigitalIdStatusBadge = () => {
    if (!digitalId) return null;
    
    switch (digitalId.status) {
      case 'ACTIVE':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            Active
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary">
            Pending
          </Badge>
        );
      case 'REVOKED':
        return (
          <Badge variant="destructive">
            Revoked
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="outline">
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading digital ID...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <Button onClick={loadUserData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Digital Identity
          </div>
          <div className="flex gap-2">
            {getVerificationBadge()}
            {getDigitalIdStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* User Information */}
        {user && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Registered:</span>
              <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="text-sm">{user.verification_status}</span>
            </div>
          </div>
        )}

        {/* Blockchain Address */}
        {userAddress && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Blockchain Address</Badge>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm">{getShortAddress(userAddress)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(userAddress, 'address')}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Digital ID Section */}
        {digitalId ? (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <p className="text-sm font-medium">Digital ID QR Code</p>
            </div>
            <div id="digital-id-qr" className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-white">
              <QRCode 
                value={digitalId.qr_code_data} 
                size={200} 
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(digitalId.qr_code_data, 'data')}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied === 'data' ? 'Copied!' : 'Copy Data'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={verifyDigitalId}
                className="text-xs"
              >
                <Shield className="h-3 w-3 mr-1" />
                Verify
              </Button>
            </div>
            
            <div className="w-full p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Blockchain Hash:</p>
              <p className="font-mono text-xs break-all">{digitalId.blockchain_hash}</p>
            </div>
          </div>
        ) : (
          // Generate Digital ID Section
          <div className="w-full flex flex-col items-center gap-3">
            {user?.verification_status === 'VERIFIED' ? (
              <>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Your account is verified. Generate your digital ID to access SafeSpot features.
                  </p>
                </div>
                <Button 
                  onClick={generateDigitalId}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate Digital ID
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your account needs to be verified before you can generate a digital ID.
                  Please contact the administrator for verification.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
            📱 Authorities can scan your QR code to verify your digital identity on the blockchain.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
