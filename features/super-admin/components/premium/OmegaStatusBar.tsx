"use client";

import type { OmegaValidationItem } from "@/lib/super-admin/premium/omega-status";
import { allValidationsPass, computeOmegaCertification } from "@/lib/super-admin/premium/omega-status";
import { SuperAdminStatusBadge } from "@/features/super-admin/components/premium/SuperAdminPremiumCard";

type OmegaStatusBarProps = {
  enterpriseScore: number;
  validations: OmegaValidationItem[];
  moduleId?: string;
};

export function OmegaStatusBar({ enterpriseScore, validations }: OmegaStatusBarProps) {
  const certification = computeOmegaCertification(validations, enterpriseScore);
  const allPass = allValidationsPass(validations);

  return (
    <div className="ea-omega-bar" role="status" aria-label="OMEGA validation status">
      <div className="ea-omega-bar__score">
        <span className="ea-omega-bar__label">Enterprise Score</span>
        <strong className="ea-omega-bar__value">{enterpriseScore}%</strong>
      </div>
      <div className="ea-omega-bar__status">
        <SuperAdminStatusBadge label={allPass ? "PASS" : "REVIEW"} status={allPass ? "healthy" : "warning"} />
        {certification.productionReady ? (
          <SuperAdminStatusBadge label="Production Ready" status="healthy" omega />
        ) : (
          <SuperAdminStatusBadge label="Certifying" status="warning" />
        )}
      </div>
      <div className="ea-omega-bar__checks" aria-label="Validation domains">
        {validations.map((item) => (
          <span
            key={item.domain}
            className={`ea-omega-pill ea-omega-pill--${item.status}`}
            title={item.label}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
