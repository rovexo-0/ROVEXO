import type { UserRole } from "@/lib/supabase/types/database";

/** Whether a Supabase auth user id is present. */
export function isAuthenticated(userId: string | null | undefined): boolean {
  return Boolean(userId);
}

/** Seller-capable roles (private seller, business, legacy admin, super admin). */
export function isSeller(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === "seller" || role === "business" || role === "admin" || role === "super_admin";
}

/** Platform administrator (legacy admin or super admin). */
export function isAdmin(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === "admin" || role === "super_admin";
}

/** Single-account super administrator. */
export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === "super_admin";
}

export type ProfileAuthFields = {
  id: string;
  email: string;
  role: UserRole;
};
