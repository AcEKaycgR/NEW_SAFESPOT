import { z } from 'zod';
import { LocationPrecision } from '../types/location';

// Privacy Settings Schema for updating user privacy settings
export const UpdatePrivacySettingsSchema = z.object({
  defaultPrecision: z.nativeEnum(LocationPrecision).optional(),
  historyRetentionDays: z.number().min(1).max(365).optional(),
  autoExpireMinutes: z.number().min(5).max(10080).optional(), // 5 minutes to 7 days
  allowEmergencyServices: z.boolean().optional(),
  allowFamilyAccess: z.boolean().optional(),
  trustedAuthorities: z.array(z.string()).optional(),
  requireExplicitConsent: z.boolean().optional(),
  allowAnalytics: z.boolean().optional(),
}).strict();
