import type { EnterpriseCoreRegistryModule } from "@/lib/enterprise-core/types";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import { INCIDENT_COMMAND_MODULE_DESCRIPTOR } from "@/lib/incident-command-center-engine/descriptor";
import { INCIDENT_TIMELINE_MODULE_DESCRIPTOR } from "@/lib/incident-timeline-engine/descriptor";
import { ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-compliance-center-engine/descriptor";
import { WORKFLOW_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-workflow-engine/descriptor";
import { HOMEPAGE_BUILDER_MODULE_DESCRIPTOR } from "@/lib/homepage-builder-engine/descriptor";
import { ENTERPRISE_AI_OS_MODULE_DESCRIPTOR } from "@/lib/enterprise-ai-operating-system/descriptor";
import { ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR } from "@/lib/enterprise-mobile-control-center/descriptor";
import { ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-deployment-center/descriptor";
import { INCIDENT_RESPONSE_MODULE_DESCRIPTOR } from "@/lib/incident-response-center/descriptor";
import { ENTERPRISE_SOC_MODULE_DESCRIPTOR } from "@/lib/enterprise-security-operations-center/descriptor";
import { ENTERPRISE_BI_MODULE_DESCRIPTOR } from "@/lib/enterprise-business-intelligence/descriptor";
import { ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR } from "@/lib/enterprise-automation-hub/descriptor";
import { OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR } from "@/lib/omega-command-center/descriptor";
import { ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-governance-center/descriptor";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";

/** Registry-driven module discovery — new modules register by exporting a descriptor. */
export const ENTERPRISE_MODULE_DESCRIPTORS: readonly EnterpriseModuleDescriptor[] = [
  INCIDENT_COMMAND_MODULE_DESCRIPTOR,
  INCIDENT_TIMELINE_MODULE_DESCRIPTOR,
  INCIDENT_RESPONSE_MODULE_DESCRIPTOR,
  ENTERPRISE_SOC_MODULE_DESCRIPTOR,
  ENTERPRISE_BI_MODULE_DESCRIPTOR,
  ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR,
  OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR,
  ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR,
  ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR,
  ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR,
  WORKFLOW_ENGINE_MODULE_DESCRIPTOR,
  HOMEPAGE_BUILDER_MODULE_DESCRIPTOR,
  ENTERPRISE_AI_OS_MODULE_DESCRIPTOR,
  ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR,
  ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR,
];

const descriptorIndex = new Map(ENTERPRISE_MODULE_DESCRIPTORS.map((module) => [module.id, module]));

export function getEnterpriseModuleDescriptor(id: string): EnterpriseModuleDescriptor | undefined {
  return descriptorIndex.get(id);
}

export function listEnterpriseModuleDescriptors(): EnterpriseModuleDescriptor[] {
  return [...ENTERPRISE_MODULE_DESCRIPTORS];
}

export function getEnterpriseModuleRoutes(moduleId: string) {
  return getEnterpriseModuleDescriptor(moduleId)?.routes ?? [];
}

export function getEnterpriseModuleApi(moduleId: string) {
  return getEnterpriseModuleDescriptor(moduleId)?.api;
}

export function getRelatedModuleHref(moduleId: string, relatedModuleId: string): string | undefined {
  const module = getEnterpriseModuleDescriptor(moduleId);
  if (!module?.relatedModules?.includes(relatedModuleId)) return undefined;
  return getEnterpriseModuleDescriptor(relatedModuleId)?.baseHref;
}

export function registerEnterpriseModuleDescriptor(
  descriptor: EnterpriseModuleDescriptor,
): EnterpriseModuleDescriptor[] {
  if (descriptorIndex.has(descriptor.id)) {
    return ENTERPRISE_MODULE_DESCRIPTORS.map((item) => (item.id === descriptor.id ? descriptor : item));
  }
  return [...ENTERPRISE_MODULE_DESCRIPTORS, descriptor];
}

export function toEnterpriseCoreModule(descriptor: EnterpriseModuleDescriptor): EnterpriseCoreRegistryModule {
  return {
    id: descriptor.id,
    label: descriptor.label,
    icon: descriptor.icon,
    description: descriptor.description,
    href: descriptor.baseHref,
    category: descriptor.category,
    version: descriptor.version,
    health: "healthy",
    autoRegister: descriptor.autoRegister,
  };
}

export function getAutoRegisteredEnterpriseCoreModules(): EnterpriseCoreRegistryModule[] {
  return ENTERPRISE_MODULE_DESCRIPTORS.filter((module) => module.autoRegister).map(toEnterpriseCoreModule);
}

export function getEnterpriseModuleSettingGroups() {
  return ENTERPRISE_MODULE_DESCRIPTORS.map((module) => ({
    id: module.id,
    label: module.label,
    href: module.baseHref,
    module: module.id,
    keys: Object.values(module.configKeys),
  }));
}
