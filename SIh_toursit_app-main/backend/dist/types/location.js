"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationSharingStatus = exports.LocationPrecision = void 0;
var LocationPrecision;
(function (LocationPrecision) {
    LocationPrecision["EXACT"] = "exact";
    LocationPrecision["STREET"] = "street";
    LocationPrecision["NEIGHBORHOOD"] = "neighborhood";
    LocationPrecision["CITY"] = "city";
})(LocationPrecision || (exports.LocationPrecision = LocationPrecision = {}));
var LocationSharingStatus;
(function (LocationSharingStatus) {
    LocationSharingStatus["DISABLED"] = "disabled";
    LocationSharingStatus["ACTIVE"] = "active";
    LocationSharingStatus["EXPIRED"] = "expired";
    LocationSharingStatus["EMERGENCY"] = "emergency";
})(LocationSharingStatus || (exports.LocationSharingStatus = LocationSharingStatus = {}));
