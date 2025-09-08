"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  QrCode, 
  User, 
  Calendar,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { useApiIntegration, blockchainService, type VerificationResponse } from '@/lib/api-integration';

interface VerificationResult {
  isValid: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    verification_status: string;
    created_at: string;
  };
  digitalId?: {
    id: number;
    blockchain_hash: string;
    status: string;
    created_at: string;
  };
  reason?: string;
  timestamp: number;
}

export function AuthorityVerificationInterface() {
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { handleApiError, handleApiSuccess } = useApiIntegration();

  const verifyDigitalId = async () => {
    if (!verificationInput.trim()) {
      handleApiError(new Error('Please enter a blockchain hash or QR code data'), 'Verification');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await blockchainService.verifyTouristIdentity(verificationInput.trim());
      
      const result: VerificationResult = {
        isValid: response.isValid,
        user: response.user,
        digitalId: response.digitalId,
        reason: response.reason,
        timestamp: Date.now()
      };

      setVerificationResult(result);
      
      // Add to history
      setVerificationHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      
      if (response.isValid) {
        handleApiSuccess('Digital ID verified successfully!');
      } else {
        handleApiError(new Error(response.reason || 'Digital ID verification failed'), 'Verification');
      }
      
      // Clear input for next verification
      setVerificationInput('');
      
    } catch (error: any) {
      const result: VerificationResult = {
        isValid: false,
        reason: error.message || 'Verification failed',
        timestamp: Date.now()
      };
      
      setVerificationResult(result);
      setVerificationHistory(prev => [result, ...prev.slice(0, 9)]);
      
      handleApiError(error, 'Verifying digital ID');
    } finally {
      setIsVerifying(false);
    }
  };

  const clearResults = () => {
    setVerificationResult(null);
    setVerificationInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearHistory = () => {
    setVerificationHistory([]);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (isValid: boolean, reason?: string) => {
    if (isValid) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Valid
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          {reason?.includes('revoked') ? 'Revoked' : 
           reason?.includes('expired') ? 'Expired' : 
           reason?.includes('not found') ? 'Not Found' : 'Invalid'}
        </Badge>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Verification Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Authority Verification System
          </CardTitle>
          <CardDescription>
            Scan or enter tourist digital ID information to verify authenticity on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-input">
              Blockchain Hash or QR Code Data
            </Label>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                id="verification-input"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                placeholder="Enter blockchain hash (0x...) or paste QR code data"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isVerifying) {
                    verifyDigitalId();
                  }
                }}
              />
              <Button 
                onClick={verifyDigitalId}
                disabled={isVerifying || !verificationInput.trim()}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Instructions:</strong> Ask the tourist to show their digital ID QR code. 
              You can scan it with your device or have them share the blockchain hash.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Result
              </div>
              <div className="flex gap-2">
                {getStatusBadge(verificationResult.isValid, verificationResult.reason)}
                <Button variant="outline" size="sm" onClick={clearResults}>
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verificationResult.isValid && verificationResult.user ? (
              <div className="space-y-4">
                {/* Tourist Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium">Tourist Information</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{verificationResult.user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{verificationResult.user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="secondary">
                          {verificationResult.user.verification_status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registered:</span>
                        <span>{new Date(verificationResult.user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">Digital ID Details</h4>
                    </div>
                    {verificationResult.digitalId && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID Status:</span>
                          <Badge variant="default" className="bg-green-500">
                            {verificationResult.digitalId.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{new Date(verificationResult.digitalId.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Blockchain Hash:</span>
                          <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                            {verificationResult.digitalId.blockchain_hash}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Verification Successful</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    This tourist's digital identity has been verified on the blockchain. 
                    You can proceed with providing services.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Verification Failed</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {verificationResult.reason || 'The provided digital ID could not be verified.'}
                  </p>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p><strong>Possible reasons:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>The digital ID has been revoked or expired</li>
                    <li>The blockchain hash is incorrect or corrupted</li>
                    <li>The tourist is not registered in the system</li>
                    <li>Network or system connectivity issues</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground">
              Verified at: {formatTimestamp(verificationResult.timestamp)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification History */}
      {verificationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Verification History
              </div>
              <Button variant="outline" size="sm" onClick={clearHistory}>
                Clear History
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationHistory.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(result.isValid, result.reason)}
                    {result.user ? (
                      <span className="text-sm font-medium">{result.user.name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {result.reason || 'Unknown user'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(result.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
