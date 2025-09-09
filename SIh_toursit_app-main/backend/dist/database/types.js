"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalIDStatus = exports.VerificationStatus = void 0;
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["VERIFIED"] = "verified";
    VerificationStatus["EXPIRED"] = "expired";
    VerificationStatus["REVOKED"] = "revoked";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var DigitalIDStatus;
(function (DigitalIDStatus) {
    DigitalIDStatus["ACTIVE"] = "active";
    DigitalIDStatus["EXPIRED"] = "expired";
    DigitalIDStatus["REVOKED"] = "revoked";
})(DigitalIDStatus || (exports.DigitalIDStatus = DigitalIDStatus = {}));
