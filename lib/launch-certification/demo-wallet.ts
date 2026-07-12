import { isCertificationMode } from "@/lib/launch-certification/certification-mode";
import {
  DEMO_WALLET_STATES,
  DEMO_WALLET_TYPES,
} from "@/lib/launch-certification/certification-mode-document2";

/** Virtual wallet balances during certification — production logic, virtual money. */
export function isVirtualWalletMode(): boolean {
  if (
    process.env.ROVEXO_VIRTUAL_WALLET === "1" ||
    process.env.ROVEXO_VIRTUAL_WALLET === "true"
  ) {
    return true;
  }
  return isCertificationMode();
}

export function listDemoWalletTypes() {
  return [...DEMO_WALLET_TYPES];
}

export function listDemoWalletStates() {
  return [...DEMO_WALLET_STATES];
}
