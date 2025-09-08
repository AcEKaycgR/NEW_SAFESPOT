"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle, CheckCircle, Scan, User, Calendar, MapPin } from "lucide-react";

interface VerificationResult {
  isValid: boolean;
  userData?: {
    name: string;
    nationality: string;
    documentType: string;
    documentNumber: string;
    registrationDate: string;
    blockchainAddress: string;
  };
  error?: string;
}

interface DigitalIDVerifierProps {
  onVerify?: (data: string) => Promise<VerificationResult>;
}

export function DigitalIDVerifier({ onVerify }: DigitalIDVerifierProps) {
  const [qrData, setQrData] = React.useState("");
  const [verificationResult, setVerificationResult] = React.useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [manualInput, setManualInput] = React.useState(false);

  const handleVerify = async () => {
    if (!qrData.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      if (onVerify) {
        const result = await onVerify(qrData);
        setVerificationResult(result);
      } else {
        // Mock verification for demonstration
        const mockResult: VerificationResult = {
          isValid: qrData.startsWith("0x"),
          userData: qrData.startsWith("0x") ? {
            name: "John Doe",
            nationality: "India",
            documentType: "Passport",
            documentNumber: "P1234567",
            registrationDate: "2024-01-15",
            blockchainAddress: qrData
          } : undefined,
          error: qrData.startsWith("0x") ? undefined : "Invalid QR code format"
        };
        setVerificationResult(mockResult);
      }
    } catch (error) {
      setVerificationResult({
        isValid: false,
        error: error instanceof Error ? error.message : "Verification failed"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setQrData("");
    setVerificationResult(null);
    setManualInput(false);
  };

  const getShortAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Digital ID Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={!manualInput ? "default" : "outline"}
              onClick={() => setManualInput(false)}
              className="flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              Scan QR Code
            </Button>
            <Button
              variant={manualInput ? "default" : "outline"}
              onClick={() => setManualInput(true)}
              className="flex items-center gap-2"
            >
              Manual Input
            </Button>
          </div>

          {manualInput ? (
            <div className="space-y-2">
              <Label htmlFor="qr-data">Digital ID Data</Label>
              <Input
                id="qr-data"
                placeholder="Enter digital ID data (e.g., 0x...)"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                className="font-mono"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
              <Scan className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Position the QR code within the camera frame
              </p>
              <div className="space-y-2">
                <Label htmlFor="qr-data-scan">Or paste QR data manually:</Label>
                <Input
                  id="qr-data-scan"
                  placeholder="Paste digital ID data here"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              disabled={!qrData.trim() || isVerifying}
              className="flex-1"
            >
              {isVerifying ? "Verifying..." : "Verify Digital ID"}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>

        {/* Verification Result Section */}
        {verificationResult && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${
              verificationResult.isValid 
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {verificationResult.isValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      Digital ID Verified
                    </span>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      Valid
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800 dark:text-red-200">
                      Verification Failed
                    </span>
                    <Badge variant="destructive">
                      Invalid
                    </Badge>
                  </>
                )}
              </div>
              
              {verificationResult.error && (
                <p className="text-sm text-red-700 dark:text-red-300">
                  {verificationResult.error}
                </p>
              )}
            </div>

            {/* User Data Display */}
            {verificationResult.isValid && verificationResult.userData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Verified User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{verificationResult.userData.name}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Nationality</Label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="font-medium">{verificationResult.userData.nationality}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Document</Label>
                        <p className="font-medium">
                          {verificationResult.userData.documentType}: ***{verificationResult.userData.documentNumber.slice(-4)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Registration Date</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="font-medium">
                            {new Date(verificationResult.userData.registrationDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Blockchain Address</Label>
                        <p className="font-mono text-sm">
                          {getShortAddress(verificationResult.userData.blockchainAddress)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                      <Shield className="h-3 w-3" />
                      <span>This digital ID has been verified on the blockchain</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
