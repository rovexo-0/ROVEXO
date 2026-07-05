export type StaffStatus = "active" | "suspended" | "archived";

export type StaffRoleId =
  | "administrator"
  | "support"
  | "marketplace_moderator"
  | "finance"
  | "shipping"
  | "business"
  | "content_manager";

export type StaffActivityModule =
  | "authentication"
  | "marketplace"
  | "orders"
  | "payments"
  | "shipping"
  | "finance"
  | "messaging"
  | "business"
  | "administration"
  | "security";

export type StaffSort =
  | "alphabetical"
  | "newest_registration"
  | "oldest_registration"
  | "recently_active"
  | "least_active";

export type StaffRoleCatalogRow = {
  id: StaffRoleId;
  label: string;
  description: string | null;
  sort_order: number;
};

export type StaffProfileRow = {
  id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  personal_email_encrypted: string;
  personal_email_hash: string;
  phone_encrypted: string | null;
  phone_hash: string | null;
  status: StaffStatus;
  registered_at: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffListItem = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  personalEmail: string;
  phoneNumber: string | null;
  status: StaffStatus;
  roles: Array<{ id: StaffRoleId; label: string }>;
  registeredAt: string;
  lastLoginAt: string | null;
};

export type StaffProfileDetail = StaffListItem & {
  profileId: string | null;
};

export type StaffActivityEntry = {
  id: string;
  module: string;
  action: string;
  result: string;
  ipAddressMasked: string | null;
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
  createdAt: string;
};

export type StaffLoginEntry = {
  id: string;
  status: "success" | "failed";
  ipAddressMasked: string | null;
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
};

export type StaffPermissionEntry = {
  id: string;
  roleId: StaffRoleId;
  roleLabel: string;
  changeType: "added" | "removed";
  performedByName: string | null;
  createdAt: string;
};

export type StaffListFilters = {
  query?: string;
  status?: StaffStatus | "all";
  role?: StaffRoleId | "all";
  sort?: StaffSort;
  limit?: number;
  offset?: number;
};

export type StaffActivityFilters = {
  module?: StaffActivityModule | "all";
  limit?: number;
  offset?: number;
};

export type StaffActionContext = {
  actorId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type CreateStaffInput = {
  firstName: string;
  lastName: string;
  personalEmail: string;
  phoneNumber?: string | null;
  profileId?: string | null;
  roleIds?: StaffRoleId[];
};

export type UpdateStaffAction =
  | "assign_role"
  | "remove_role"
  | "suspend"
  | "reactivate"
  | "archive"
  | "reset_password"
  | "force_logout"
  | "update_profile";
