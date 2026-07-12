import { isLaunchPrivateMode } from "@/lib/launch-certification/private-mode";
import {
  CERTIFICATION_MODE_COPY,
  CERTIFICATION_MODE_VERSION,
} from "@/lib/launch-certification/certification-mode-document2";
import { isVirtualPaymentMode } from "@/lib/launch-certification/demo-payments";
import { isVirtualWalletMode } from "@/lib/launch-certification/demo-wallet";

/** Certification Mode = production simulation before official launch (Document 2). */
export function isCertificationMode(): boolean {
  return isLaunchPrivateMode();
}

export function resolveCertificationModeConfig() {
  return {
    version: CERTIFICATION_MODE_VERSION,
    active: isCertificationMode(),
    copy: CERTIFICATION_MODE_COPY,
    virtualPayments: isVirtualPaymentMode(),
    virtualWallet: isVirtualWalletMode(),
    sendcloudSandbox: isSendcloudSandboxMode(),
  };
}

/** Sendcloud runs in sandbox during certification unless explicitly overridden. */
export function isSendcloudSandboxMode(): boolean {
  if (process.env.SENDCLOUD_SANDBOX === "0") return false;
  if (process.env.SENDCLOUD_SANDBOX === "1" || process.env.SENDCLOUD_SANDBOX === "true") {
    return true;
  }
  return isCertificationMode();
}
