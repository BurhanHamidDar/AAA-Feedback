/**
 * Admin role — determines what data they can access.
 */
export declare enum AdminRole {
    /** Full access including identity for all feedback types. */
    PRINCIPAL = "principal",
    /** Standard admin — cannot see identity for PRINCIPAL_ONLY feedback. */
    ADMIN = "admin"
}
export interface Admin {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    created_at: string;
}
export interface AdminSession {
    admin: Admin;
    access_token: string;
    refresh_token: string;
    expires_at: number;
}
//# sourceMappingURL=admin.d.ts.map