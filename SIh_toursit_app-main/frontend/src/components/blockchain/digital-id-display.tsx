"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, User, Copy, Download, Shield } from "lucide-react";
import QRCode from "qrcode.react";

interface UserData {
  name?: string;
  email?: string;
  nationality?: string;
  documentType?: string;
  documentNumber?: string;
  registrationDate?: string;
  verified?: boolean;
}

interface DigitalIDDisplayProps {
  userAddress: string;
  digitalIDData: string; // This should be the hex string of the user's data
  userData?: UserData;
  isVerified?: boolean;
}

export function DigitalIDDisplay({ 
  userAddress, 
  digitalIDData, 
  userData, 
  isVerified = false 
}: DigitalIDDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const getShortAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('#digital-id-qr canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL();
      const link = document.createElement('a');
      link.download = `digital-id-${getShortAddress(userAddress)}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Digital ID
          </div>
          {isVerified && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* User Information */}
        {userData && (
          <div className="space-y-2">
            {userData.name && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{userData.name}</span>
              </div>
            )}
            {userData.nationality && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nationality:</span>
                <span className="text-sm font-medium">{userData.nationality}</span>
              </div>
            )}
            {userData.documentType && userData.documentNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{userData.documentType}:</span>
                <span className="text-sm font-mono">***{userData.documentNumber.slice(-4)}</span>
              </div>
            )}
            {userData.registrationDate && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Registered:</span>
                <span className="text-sm">{new Date(userData.registrationDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Blockchain Address */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Blockchain Address</Badge>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm">{getShortAddress(userAddress)}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(userAddress)}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="w-full flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            <p className="text-sm font-medium">Digital ID QR Code</p>
          </div>
          <div id="digital-id-qr" className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-white">
            <QRCode 
              value={digitalIDData} 
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
              onClick={() => copyToClipboard(digitalIDData)}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copied ? 'Copied!' : 'Copy Data'}
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
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
            📱 Authorities can scan this QR code to verify your digital identity on the blockchain.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
