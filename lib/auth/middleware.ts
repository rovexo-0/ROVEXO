/**
 * Auth middleware SSOT — route protection config.
 * Session refresh + redirects are implemented in lib/supabase/middleware.ts.
 */
export {
  AUTH_PROTECTED_PREFIXES,
  AUTH_PUBLIC_PREFIXES,
  AUTH_SUPER_ADMIN_PREFIXES,
  isAuthProtectedPath,
} from "@/lib/auth/protected-routes";
