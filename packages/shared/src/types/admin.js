"use strict";
// ============================================================
// Admin / User Types
// Ayesha Ali Academy Feedback Management System
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRole = void 0;
/**
 * Admin role — determines what data they can access.
 */
var AdminRole;
(function (AdminRole) {
    /** Full access including identity for all feedback types. */
    AdminRole["PRINCIPAL"] = "principal";
    /** Standard admin — cannot see identity for PRINCIPAL_ONLY feedback. */
    AdminRole["ADMIN"] = "admin";
})(AdminRole || (exports.AdminRole = AdminRole = {}));
//# sourceMappingURL=admin.js.map