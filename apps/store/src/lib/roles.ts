export const ADMIN_ROLES        = ["admin", "superadmin"] as const;
export const RECEPTIONIST_ROLES = ["admin", "superadmin", "receptionist"] as const;
export const STAFF_ROLES        = ["admin", "superadmin", "receptionist", "technician"] as const;

export function isAdmin(role?: string | null)       { return ADMIN_ROLES.includes(role as never); }
export function isReceptionist(role?: string | null){ return RECEPTIONIST_ROLES.includes(role as never); }
export function isStaff(role?: string | null)       { return STAFF_ROLES.includes(role as never); }
