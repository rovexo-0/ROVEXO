import type { DeploymentBuild, ValidationType } from "@/lib/enterprise-deployment-center/types";
import { VALIDATION_TYPES } from "@/lib/enterprise-deployment-center/registry";

export function createDeploymentBuild(version: string): DeploymentBuild {
  return {
    id: `build-${Date.now()}`,
    version,
    artifact: `rovexo-platform-${version}.tar.gz`,
    status: "building",
    validations: [],
    createdAt: new Date().toISOString(),
  };
}

export function runValidations(build: DeploymentBuild): DeploymentBuild {
  return {
    ...build,
    status: "validated",
    validations: [...VALIDATION_TYPES],
  };
}

export function isValidValidationType(type: string): type is ValidationType {
  return (VALIDATION_TYPES as readonly string[]).includes(type);
}

export function validationScore(build: DeploymentBuild): number {
  if (build.status === "failed") return 0;
  if (build.validations.length === 0) return 50;
  return Math.round((build.validations.length / VALIDATION_TYPES.length) * 100);
}

export function failBuild(build: DeploymentBuild): DeploymentBuild {
  return { ...build, status: "failed" };
}
