"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyController = exports.PrivacyController = void 0;
const location_queries_1 = require("../database/location-queries");
const privacy_1 = require("../schemas/privacy");
class PrivacyController {
    async getPrivacySettings(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const userId = req.user.id;
            await location_queries_1.locationQueries.ensureUserExists(userId, req.user.email || 'unknown@example.com', req.user.name || 'Unknown User');
            const privacySettings = await location_queries_1.locationQueries.getPrivacySettings(userId);
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
            let trustedAuthorities = [];
            try {
                trustedAuthorities = privacySettings.trusted_authorities ?
                    JSON.parse(privacySettings.trusted_authorities) : [];
            }
            catch (e) {
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
        }
        catch (error) {
            console.error('Error getting privacy settings:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    async updatePrivacySettings(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            const userId = req.user.id;
            await location_queries_1.locationQueries.ensureUserExists(userId, req.user.email || 'unknown@example.com', req.user.name || 'Unknown User');
            const validationResult = privacy_1.UpdatePrivacySettingsSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    error: `Validation error: ${validationResult.error.issues.map((i) => i.message).join(', ')}`
                });
                return;
            }
            const updateData = validationResult.data;
            const dbUpdateData = {};
            if (updateData.defaultPrecision !== undefined)
                dbUpdateData.default_precision = updateData.defaultPrecision;
            if (updateData.historyRetentionDays !== undefined)
                dbUpdateData.history_retention_days = updateData.historyRetentionDays;
            if (updateData.autoExpireMinutes !== undefined)
                dbUpdateData.auto_expire_minutes = updateData.autoExpireMinutes;
            if (updateData.allowEmergencyServices !== undefined)
                dbUpdateData.allow_emergency_access = updateData.allowEmergencyServices;
            if (updateData.allowFamilyAccess !== undefined)
                dbUpdateData.notify_on_access = updateData.allowFamilyAccess;
            if (updateData.trustedAuthorities !== undefined)
                dbUpdateData.trusted_authorities = updateData.trustedAuthorities;
            const updatedSettings = await location_queries_1.locationQueries.updatePrivacySettings(userId, dbUpdateData);
            let trustedAuthorities = [];
            try {
                trustedAuthorities = updatedSettings.trusted_authorities ?
                    JSON.parse(updatedSettings.trusted_authorities) : [];
            }
            catch (e) {
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
        }
        catch (error) {
            console.error('Error updating privacy settings:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
exports.PrivacyController = PrivacyController;
exports.privacyController = new PrivacyController();
