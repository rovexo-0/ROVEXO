export {
  STAFF_ENTERPRISE_HOST,
  STAFF_ENTERPRISE_MODULES,
  STAFF_ENTERPRISE_PLATFORMS,
  STAFF_ROLE_MODULE_ACCESS,
  type StaffEnterpriseModuleId,
  type StaffEnterprisePlatformId,
} from "@/lib/staff-enterprise/constants";

export { STAFF_ENTERPRISE_MODULE_DESCRIPTOR } from "@/lib/staff-enterprise/descriptor";

export {
  canStaffPerform,
  loadStaffRoleIds,
  loadStaffRoleIdsByProfileId,
  resolveStaffDashboardModules,
  roleIdsGrantModule,
  type StaffPermissionCheck,
} from "@/lib/staff-enterprise/permissions";

export {
  listStaffDirectory,
  registerStaffDevice,
  touchStaffPresence,
  upsertStaffPresence,
  type StaffPresenceStatus,
} from "@/lib/staff-enterprise/directory";

export {
  ensureDirectStaffChannel,
  listStaffChannelMessages,
  listStaffChannels,
  sendStaffMessage,
} from "@/lib/staff-enterprise/messaging";

export {
  runStaffEnterpriseCertification,
  type StaffEnterpriseCertificationReport,
} from "@/lib/staff-enterprise/certification";
