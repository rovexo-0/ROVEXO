export type {
  CreateStaffInput,
  StaffActionContext,
  StaffActivityEntry,
  StaffActivityFilters,
  StaffActivityModule,
  StaffListFilters,
  StaffListItem,
  StaffLoginEntry,
  StaffPermissionEntry,
  StaffProfileDetail,
  StaffRoleCatalogRow,
  StaffRoleId,
  StaffSort,
  StaffStatus,
  UpdateStaffAction,
} from "@/lib/staff-profile/types";

export {
  assignStaffRole,
  createStaffProfile,
  ensureSuperAdminStaffProfile,
  forceStaffLogout,
  getStaffProfileDetail,
  listStaffActivity,
  listStaffLoginHistory,
  listStaffPermissionHistory,
  listStaffProfiles,
  listStaffRoleCatalog,
  recordStaffActivity,
  recordStaffLoginEvent,
  removeStaffRole,
  resetStaffPassword,
  syncStaffLastLogin,
  updateStaffProfileFields,
  updateStaffStatus,
} from "@/lib/staff-profile/service";

export { maskIpAddress } from "@/lib/staff-profile/encryption";
export { parseUserAgent, readRequestClientContext, toStaffActionContext } from "@/lib/staff-profile/request-context";
