"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePrivacySettingsSchema = void 0;
const zod_1 = require("zod");
const location_1 = require("../types/location");
exports.UpdatePrivacySettingsSchema = zod_1.z.object({
    defaultPrecision: zod_1.z.nativeEnum(location_1.LocationPrecision).optional(),
    historyRetentionDays: zod_1.z.number().min(1).max(365).optional(),
    autoExpireMinutes: zod_1.z.number().min(5).max(10080).optional(),
    allowEmergencyServices: zod_1.z.boolean().optional(),
    allowFamilyAccess: zod_1.z.boolean().optional(),
    trustedAuthorities: zod_1.z.array(zod_1.z.string()).optional(),
    requireExplicitConsent: zod_1.z.boolean().optional(),
    allowAnalytics: zod_1.z.boolean().optional(),
}).strict();
