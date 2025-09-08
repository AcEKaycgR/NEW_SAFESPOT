// Enhanced User Registration for Geofencing Integration
// File: frontend/src/components/auth/enhanced-registration.tsx

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WalletConnection } from "@/components/blockchain/wallet-connection";

interface EnhancedRegistrationData {
  // Basic Info
  email: string;
  name: string;
  phone: string;
  
  // Geofencing Preferences
  locationSharingLevel: 'EXACT' | 'APPROXIMATE' | 'GENERAL';
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  preferredSafetyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  travelPreferences: {
    maxRiskZones: boolean;
    receiveAlerts: boolean;
    shareWithAuthorities: boolean;
    autoEmergencyMode: boolean;
  };
  
  // Tourist Specific
  homeCountry: string;
  plannedDestinations: string[];
  travelDuration: string;
  accommodationDetails?: string;
  
  // Wallet Info
  walletAddress?: string;
  blockchainConsent: boolean;
}

export function EnhancedRegistration() {
  const [formData, setFormData] = useState<EnhancedRegistrationData>({
    email: '',
    name: '',
    phone: '',
    locationSharingLevel: 'APPROXIMATE',
    emergencyContacts: [{ name: '', phone: '', relationship: '' }],
    preferredSafetyLevel: 'MEDIUM',
    travelPreferences: {
      maxRiskZones: false,
      receiveAlerts: true,
      shareWithAuthorities: true,
      autoEmergencyMode: true
    },
    homeCountry: '',
    plannedDestinations: [],
    travelDuration: '',
    blockchainConsent: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleWalletConnected = (address: string, provider: any) => {
    setFormData(prev => ({ ...prev, walletAddress: address }));
    console.log('Wallet connected for enhanced registration:', address);
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', phone: '', relationship: '' }]
    }));
  };

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const submitRegistration = async () => {
    try {
      // Enhanced registration API call with geofencing data
      const response = await fetch('/api/users/enhanced-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        console.log('Enhanced registration successful with geofencing preferences');
        // Redirect to dashboard or next step
      }
    } catch (error) {
      console.error('Enhanced registration failed:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="homeCountry">Home Country</Label>
                <Input
                  id="homeCountry"
                  value={formData.homeCountry}
                  onChange={(e) => setFormData(prev => ({ ...prev, homeCountry: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Safety & Location Preferences</h3>
            
            <div>
              <Label>Location Sharing Precision</Label>
              <Select
                value={formData.locationSharingLevel}
                onValueChange={(value: 'EXACT' | 'APPROXIMATE' | 'GENERAL') => 
                  setFormData(prev => ({ ...prev, locationSharingLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXACT">Exact Location (GPS coordinates)</SelectItem>
                  <SelectItem value="APPROXIMATE">Approximate (within 100m)</SelectItem>
                  <SelectItem value="GENERAL">General Area (within 1km)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preferred Safety Level</Label>
              <Select
                value={formData.preferredSafetyLevel}
                onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                  setFormData(prev => ({ ...prev, preferredSafetyLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low - Minimal alerts</SelectItem>
                  <SelectItem value="MEDIUM">Medium - Balanced monitoring</SelectItem>
                  <SelectItem value="HIGH">High - Maximum protection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Safety Preferences</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="receiveAlerts"
                    checked={formData.travelPreferences.receiveAlerts}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        travelPreferences: { ...prev.travelPreferences, receiveAlerts: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="receiveAlerts">Receive real-time safety alerts</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareWithAuthorities"
                    checked={formData.travelPreferences.shareWithAuthorities}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        travelPreferences: { ...prev.travelPreferences, shareWithAuthorities: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="shareWithAuthorities">Share location with local authorities in emergencies</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoEmergencyMode"
                    checked={formData.travelPreferences.autoEmergencyMode}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        travelPreferences: { ...prev.travelPreferences, autoEmergencyMode: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="autoEmergencyMode">Auto-enable emergency mode in high-risk zones</Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contacts</h3>
            {formData.emergencyContacts.map((contact, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Input
                      value={contact.relationship}
                      onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button onClick={addEmergencyContact} variant="outline">
              Add Another Contact
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Blockchain Wallet Connection</h3>
            <p className="text-gray-600">
              Connect your wallet to enable secure, blockchain-based identity verification
              and enhanced geofencing features.
            </p>
            
            <WalletConnection onWalletConnected={handleWalletConnected} />
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="blockchainConsent"
                checked={formData.blockchainConsent}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, blockchainConsent: !!checked }))
                }
              />
              <Label htmlFor="blockchainConsent">
                I consent to storing my identity hash on the blockchain for verification
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Tourist Registration</CardTitle>
        <CardDescription>
          Step {currentStep} of {totalSteps}: Complete your profile for personalized safety features
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStep()}
        
        <div className="flex justify-between mt-6">
          <Button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            variant="outline"
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={() => setCurrentStep(prev => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={submitRegistration}
              disabled={!formData.blockchainConsent || !formData.walletAddress}
            >
              Complete Registration
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
