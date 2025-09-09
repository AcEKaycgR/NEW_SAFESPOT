"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Decimal, objectEnumValues, makeStrictEnum, Public, getRuntime, skip } = require('./runtime/index-browser.js');
const Prisma = {};
exports.Prisma = Prisma;
exports.$Enums = {};
Prisma.prismaVersion = {
    client: "6.15.0",
    engine: "85179d7826409ee107a6ba334b5e305ae3fba9fb"
};
Prisma.PrismaClientKnownRequestError = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.PrismaClientUnknownRequestError = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.PrismaClientRustPanicError = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.PrismaClientInitializationError = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.PrismaClientValidationError = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.Decimal = Decimal;
Prisma.sql = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.empty = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.join = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.raw = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.validator = Public.validator;
Prisma.getExtensionContext = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.defineExtension = () => {
    const runtimeName = getRuntime().prettyName;
    throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`);
};
Prisma.DbNull = objectEnumValues.instances.DbNull;
Prisma.JsonNull = objectEnumValues.instances.JsonNull;
Prisma.AnyNull = objectEnumValues.instances.AnyNull;
Prisma.NullTypes = {
    DbNull: objectEnumValues.classes.DbNull,
    JsonNull: objectEnumValues.classes.JsonNull,
    AnyNull: objectEnumValues.classes.AnyNull
};
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
    Serializable: 'Serializable'
});
exports.Prisma.UserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    name: 'name',
    blockchain_address: 'blockchain_address',
    verification_status: 'verification_status',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.Prisma.UserProfileScalarFieldEnum = {
    id: 'id',
    user_id: 'user_id',
    kyc_data: 'kyc_data',
    emergency_contacts: 'emergency_contacts',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.Prisma.DigitalIDScalarFieldEnum = {
    id: 'id',
    user_id: 'user_id',
    blockchain_hash: 'blockchain_hash',
    qr_code_data: 'qr_code_data',
    valid_from: 'valid_from',
    valid_until: 'valid_until',
    status: 'status',
    created_at: 'created_at'
};
exports.Prisma.LocationSharingSettingsScalarFieldEnum = {
    id: 'id',
    user_id: 'user_id',
    status: 'status',
    precision: 'precision',
    expires_at: 'expires_at',
    created_at: 'created_at',
    updated_at: 'updated_at',
    emergency_override: 'emergency_override',
    allowed_accessors: 'allowed_accessors'
};
exports.Prisma.LocationAccessLogScalarFieldEnum = {
    id: 'id',
    sharing_id: 'sharing_id',
    accessor_id: 'accessor_id',
    accessor_type: 'accessor_type',
    accessed_at: 'accessed_at',
    encrypted_coordinates: 'encrypted_coordinates',
    salt: 'salt',
    iv: 'iv',
    precision: 'precision',
    reason: 'reason',
    blockchain_hash: 'blockchain_hash'
};
exports.Prisma.EmergencyLocationRequestScalarFieldEnum = {
    id: 'id',
    request_id: 'request_id',
    authority_id: 'authority_id',
    target_user_id: 'target_user_id',
    reason: 'reason',
    urgency_level: 'urgency_level',
    requested_at: 'requested_at',
    approved_at: 'approved_at',
    expires_at: 'expires_at'
};
exports.Prisma.LocationHistoryEntryScalarFieldEnum = {
    id: 'id',
    user_id: 'user_id',
    encrypted_coordinates: 'encrypted_coordinates',
    salt: 'salt',
    iv: 'iv',
    precision: 'precision',
    accuracy: 'accuracy',
    recorded_at: 'recorded_at',
    source: 'source',
    retain_until: 'retain_until'
};
exports.Prisma.LocationPrivacySettingsScalarFieldEnum = {
    id: 'id',
    user_id: 'user_id',
    default_precision: 'default_precision',
    allow_emergency_access: 'allow_emergency_access',
    history_retention_days: 'history_retention_days',
    notify_on_access: 'notify_on_access',
    auto_expire_minutes: 'auto_expire_minutes',
    trusted_authorities: 'trusted_authorities',
    updated_at: 'updated_at'
};
exports.Prisma.GeofenceAreaScalarFieldEnum = {
    id: 'id',
    name: 'name',
    description: 'description',
    polygon_coords: 'polygon_coords',
    risk_level: 'risk_level',
    type: 'type',
    created_by: 'created_by',
    is_active: 'is_active',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.Prisma.GeofenceBreachScalarFieldEnum = {
    id: 'id',
    user_id: 'user_id',
    geofence_id: 'geofence_id',
    latitude: 'latitude',
    longitude: 'longitude',
    risk_score: 'risk_score',
    alert_sent: 'alert_sent',
    occurred_at: 'occurred_at'
};
exports.Prisma.EmergencyAccessLogScalarFieldEnum = {
    id: 'id',
    user_id: 'user_id',
    service_id: 'service_id',
    operator_id: 'operator_id',
    incident_id: 'incident_id',
    access_granted: 'access_granted',
    request_reason: 'request_reason',
    emergency_type: 'emergency_type',
    jurisdiction: 'jurisdiction',
    created_at: 'created_at'
};
exports.Prisma.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.Prisma.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.VerificationStatus = exports.$Enums.VerificationStatus = {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    EXPIRED: 'EXPIRED',
    REVOKED: 'REVOKED'
};
exports.DigitalIDStatus = exports.$Enums.DigitalIDStatus = {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    REVOKED: 'REVOKED'
};
exports.LocationSharingStatus = exports.$Enums.LocationSharingStatus = {
    DISABLED: 'DISABLED',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    EMERGENCY: 'EMERGENCY'
};
exports.LocationPrecision = exports.$Enums.LocationPrecision = {
    EXACT: 'EXACT',
    STREET: 'STREET',
    NEIGHBORHOOD: 'NEIGHBORHOOD',
    CITY: 'CITY'
};
exports.LocationAccessorType = exports.$Enums.LocationAccessorType = {
    EMERGENCY: 'EMERGENCY',
    AUTHORITY: 'AUTHORITY',
    USER: 'USER'
};
exports.EmergencyUrgencyLevel = exports.$Enums.EmergencyUrgencyLevel = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};
exports.LocationSource = exports.$Enums.LocationSource = {
    GPS: 'GPS',
    NETWORK: 'NETWORK',
    MANUAL: 'MANUAL'
};
exports.RiskLevel = exports.$Enums.RiskLevel = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
};
exports.GeofenceType = exports.$Enums.GeofenceType = {
    SAFE_ZONE: 'SAFE_ZONE',
    ALERT_ZONE: 'ALERT_ZONE',
    RESTRICTED: 'RESTRICTED'
};
exports.Prisma.ModelName = {
    User: 'User',
    UserProfile: 'UserProfile',
    DigitalID: 'DigitalID',
    LocationSharingSettings: 'LocationSharingSettings',
    LocationAccessLog: 'LocationAccessLog',
    EmergencyLocationRequest: 'EmergencyLocationRequest',
    LocationHistoryEntry: 'LocationHistoryEntry',
    LocationPrivacySettings: 'LocationPrivacySettings',
    GeofenceArea: 'GeofenceArea',
    GeofenceBreach: 'GeofenceBreach',
    EmergencyAccessLog: 'EmergencyAccessLog'
};
class PrismaClient {
    constructor() {
        return new Proxy(this, {
            get(target, prop) {
                let message;
                const runtime = getRuntime();
                if (runtime.isEdge) {
                    message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
                }
                else {
                    message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).';
                }
                message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`;
                throw new Error(message);
            }
        });
    }
}
exports.PrismaClient = PrismaClient;
Object.assign(exports, Prisma);
