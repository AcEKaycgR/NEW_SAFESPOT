import { Response } from 'express';
import { AuthenticatedRequest } from './location.controller';
import { locationQueries } from '../database/location-queries';
import { LocationPrecision } from '../types/location';
import { UpdatePrivacySettingsSchema } from '../schemas/privacy';

export class PrivacyController {
  
  async getPrivacySettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const userId = req.user.id;
      
      // Ensure user exists before getting privacy settings
      await locationQueries.ensureUserExists(userId, req.user.email || 'unknown@example.com', req.user.name || 'Unknown User');
      
      const privacySettings = await locationQueries.getPrivacySettings(userId);

      // Return default settings if none exist
      if (!privacySettings) {
        res.status(200).json({
          success: true,
          data: {
            default_precision: 'STREET',
            allow_emergency_access: true,
            history_retention_days: 30,
            notify_on_access: true,
            auto_expire_minutes: 240,
            trusted_authorities: []
          }
        });
        return;
      }

      // Parse trusted_authorities JSON string
      let trustedAuthorities = [];
      try {
        trustedAuthorities = privacySettings.trusted_authorities ? 
          JSON.parse(privacySettings.trusted_authorities) : [];
      } catch (e) {
        trustedAuthorities = [];
      }

      res.status(200).json({
        success: true,
        data: {
          default_precision: privacySettings.default_precision,
          allow_emergency_access: privacySettings.allow_emergency_access,
          history_retention_days: privacySettings.history_retention_days,
          notify_on_access: privacySettings.notify_on_access,
          auto_expire_minutes: privacySettings.auto_expire_minutes,
          trusted_authorities: trustedAuthorities
        }
      });
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updatePrivacySettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const userId = req.user.id;
      
      // Ensure user exists before updating privacy settings
      await locationQueries.ensureUserExists(userId, req.user.email || 'unknown@example.com', req.user.name || 'Unknown User');
      
      // Validate the input data using Zod schema
      const validationResult = UpdatePrivacySettingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: `Validation error: ${validationResult.error.issues.map((i: any) => i.message).join(', ')}`
        });
        return;
      }

      const updateData = validationResult.data;

      // Map camelCase to snake_case for database
      const dbUpdateData: any = {};
      if (updateData.defaultPrecision !== undefined) dbUpdateData.default_precision = updateData.defaultPrecision;
      if (updateData.historyRetentionDays !== undefined) dbUpdateData.history_retention_days = updateData.historyRetentionDays;
      if (updateData.autoExpireMinutes !== undefined) dbUpdateData.auto_expire_minutes = updateData.autoExpireMinutes;
      if (updateData.allowEmergencyServices !== undefined) dbUpdateData.allow_emergency_access = updateData.allowEmergencyServices;
      if (updateData.allowFamilyAccess !== undefined) dbUpdateData.notify_on_access = updateData.allowFamilyAccess;
      if (updateData.trustedAuthorities !== undefined) dbUpdateData.trusted_authorities = updateData.trustedAuthorities;

      const updatedSettings = await locationQueries.updatePrivacySettings(userId, dbUpdateData);

      // Parse trusted_authorities JSON string
      let trustedAuthorities = [];
      try {
        trustedAuthorities = updatedSettings.trusted_authorities ? 
          JSON.parse(updatedSettings.trusted_authorities) : [];
      } catch (e) {
        trustedAuthorities = [];
      }

      res.status(200).json({
        success: true,
        data: {
          default_precision: updatedSettings.default_precision,
          allow_emergency_access: updatedSettings.allow_emergency_access,
          history_retention_days: updatedSettings.history_retention_days,
          notify_on_access: updatedSettings.notify_on_access,
          auto_expire_minutes: updatedSettings.auto_expire_minutes,
          trusted_authorities: trustedAuthorities
        }
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

// Export an instance for use in routes
export const privacyController = new PrivacyController();
