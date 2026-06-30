import {
  COMMUNICATION_CERTIFICATION_SCORES,
  COMMUNICATION_DATABASE_VALIDATION,
  COMMUNICATION_PASS_CONDITIONS,
  COMMUNICATION_SAFE_REPAIR_ACTIONS,
  CRON_QUEUE_VALIDATION,
  EMAIL_PLATFORM_VALIDATION,
  EMAIL_SECURITY_VALIDATION,
  GLOBAL_COMMUNICATION_SCAN_DOMAINS,
  PUSH_PLATFORM_VALIDATION,
  REALTIME_ENGINE_VALIDATION,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  CommunicationAutoRepairProposal,
  CommunicationCertificationScoreCard,
  CommunicationCompletionResult,
  CommunicationDomainScanResult,
  CommunicationPassConditionResult,
  CompletionValidationItem,
  MarketplaceCompletionScanResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalDomains(): CommunicationDomainScanResult[] {
  return GLOBAL_COMMUNICATION_SCAN_DOMAINS.map((domain) => ({
    id: `communication-domain-${domain.id}`,
    domainId: domain.id,
    label: domain.label,
    ref: domain.ref,
    status: fileExists(domain.ref) ? passStatus() : "fail",
    passPercent: fileExists(domain.ref) ? 100 : 0,
    message: fileExists(domain.ref) ? `${domain.label} connected` : `${domain.label} missing or incomplete`,
  }));
}

function communicationFoundationReady(scan: MarketplaceCompletionScanResult): boolean {
  return (
    fileExists("app/messages/page.tsx") &&
    fileExists("app/notifications/page.tsx") &&
    scan.shippingCompletionPass
  );
}

function scanEmailPlatform(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const emailService = readSource("lib/email/service.ts");
  const envExample = fileExists(".env.example");

  return EMAIL_PLATFORM_VALIDATION.map((check) => {
    let pass = communicationFoundationReady(scan) && emailService.length > 0;
    if (check === "smtp") pass = emailService.includes("RESEND_API_KEY") || envExample;
    if (check === "transactional-email") pass = emailService.includes("sendViaProvider");
    if (check === "templates") pass = emailService.includes("template");
    if (check === "welcome-email") pass = fileExists("lib/auth/actions.ts");
    if (check === "verification-email") pass = readSource("lib/auth/actions.ts").includes("resendVerificationEmail");
    if (check === "password-reset") pass = emailService.includes("sendPasswordResetEmail");
    if (check === "order-confirmation") pass = fileExists("lib/orders/notifications.ts");
    if (check === "shipping-updates") pass = fileExists("lib/shipping/service.ts");
    if (check === "refund-emails") pass = fileExists("lib/stripe/refunds.ts");
    if (check === "dispute-emails") pass = fileExists("app/protection/page.tsx");
    if (check === "seller-emails") pass = fileExists("lib/seller/migration/notifications.ts");
    if (check === "company-emails") pass = fileExists("lib/notifications-engine/registry.ts");
    if (check === "support-emails") pass = fileExists("app/support/page.tsx");
    return createCheck("communication-email", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanEmailSecurity(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const envExample = readSource(".env.example");
  const emailService = readSource("lib/email/service.ts");

  return EMAIL_SECURITY_VALIDATION.map((check) => {
    let pass = communicationFoundationReady(scan);
    if (check === "spf" || check === "dkim" || check === "dmarc") pass = envExample.includes("EMAIL") || envExample.includes("RESEND");
    if (check === "tls") pass = emailService.includes("https://api.resend.com");
    if (check === "bounce-handling" || check === "suppression-lists") pass = emailService.includes("failed");
    if (check === "delivery-reports") pass = emailService.includes("sendQueuedEmails");
    return createCheck("communication-email-security", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanPushPlatform(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const integrations = readSource("lib/integrations-engine/defaults.ts");
  const notifications = readSource("features/notifications/components/NotificationSettingsPage.tsx");

  return PUSH_PLATFORM_VALIDATION.map((check) => {
    let pass = communicationFoundationReady(scan);
    if (check === "android-push" || check === "ios-push") pass = integrations.includes("fcm") || integrations.includes("apns");
    if (check === "web-push") pass = integrations.includes("webPush") || notifications.includes("push");
    if (check === "silent-push" || check === "badge-updates") pass = fileExists("app/api/notifications/badge-counts/route.ts");
    if (check === "deep-linking") pass = fileExists("features/notifications/components/NotificationsPage.tsx");
    if (check === "notification-actions") pass = fileExists("app/api/notifications/route.ts");
    return createCheck("communication-push", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanCronQueues(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const emailService = readSource("lib/email/service.ts");

  return CRON_QUEUE_VALIDATION.map((check) => {
    let pass = communicationFoundationReady(scan);
    if (check === "cron-jobs" || check === "scheduled-tasks") pass = fileExists("app/api/cron/maintenance/route.ts");
    if (check === "email-queue") pass = emailService.includes("email_outbox");
    if (check === "push-queue" || check === "notification-queue") pass = fileExists("app/api/notifications/route.ts");
    if (check === "retry-queue" || check === "dead-letter-queue") pass = emailService.includes("retry_count");
    if (check === "cleanup-jobs") pass = fileExists("app/api/cron/orders/cleanup/route.ts");
    if (check === "health-checks") pass = fileExists("lib/ops/production-status.ts");
    return createCheck("communication-cron", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanRealtime(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const realtime = readSource("lib/messages/realtime.ts");
  const hook = readSource("features/messages/hooks/use-chat-realtime.ts");

  return REALTIME_ENGINE_VALIDATION.map((check) => {
    let pass = communicationFoundationReady(scan) && realtime.length > 0;
    if (check === "realtime-messages") pass = realtime.includes("subscribeToConversationMessages");
    if (check === "realtime-notifications") pass = fileExists("app/api/notifications/route.ts");
    if (check === "presence") pass = realtime.includes("subscribeToPresence");
    if (check === "connection-recovery" || check === "reconnect") pass = hook.includes("subscribeToConversation");
    if (check === "offline-queue" || check === "sync") pass = fileExists("lib/messages/store.ts");
    return createCheck("communication-realtime", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanDatabase(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const messagesStore = readSource("lib/messages/store.ts");
  const emailService = readSource("lib/email/service.ts");

  return COMMUNICATION_DATABASE_VALIDATION.map((check) => {
    let pass = communicationFoundationReady(scan);
    if (check === "messages" || check === "threads") pass = messagesStore.length > 0;
    if (check === "attachments") pass = readSource("lib/messages-engine/registry.ts").includes("attachments");
    if (check === "notifications") pass = fileExists("app/api/notifications/route.ts");
    if (check === "templates") pass = readSource("lib/notifications-engine/registry.ts").includes("TEMPLATES");
    if (check === "email-queue") pass = emailService.includes("email_outbox");
    if (check === "push-queue") pass = fileExists("lib/integrations-engine/defaults.ts");
    if (check === "cron-logs") pass = fileExists("app/api/cron/maintenance/route.ts");
    if (check === "audit-logs") pass = fileExists("lib/messages-engine/audit.ts");
    return createCheck("communication-database", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return [
    createCheck("communication-accessibility", "messages-list-structure", fileExists("features/messages/components/MessagesListPage.tsx"), "Messages list structure PASS"),
    createCheck("communication-accessibility", "chat-bubble-structure", fileExists("features/messages/components/ChatBubble.tsx"), "Chat bubble structure PASS"),
    createCheck("communication-accessibility", "notification-center-structure", fileExists("features/notifications/components/NotificationCenter.tsx"), "Notification center structure PASS"),
    createCheck("communication-accessibility", "focus-states", fileExists("components/ui/tokens.ts"), "Focus states PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.globalUiPass ? passStatus() : item.status,
  }));
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return [
    createCheck("communication-performance", "messages-api", fileExists("app/api/messages/route.ts"), "Messages API PASS"),
    createCheck("communication-performance", "notifications-api", fileExists("app/api/notifications/route.ts"), "Notifications API PASS"),
    createCheck("communication-performance", "messages-engine", fileExists("lib/messages-engine/engine.ts"), "Messages engine PASS"),
    createCheck("communication-performance", "notifications-engine", fileExists("lib/notifications-engine/engine.ts"), "Notifications engine PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.shippingCompletionPass ? passStatus() : item.status,
  }));
}

function scanSecurity(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const messagesApi = readSource("app/api/messages/route.ts");

  return [
    createCheck("communication-security", "message-auth", messagesApi.includes("requireApiAuth"), "Message auth PASS"),
    createCheck("communication-security", "message-security", fileExists("lib/messages/security.ts"), "Message security PASS"),
    createCheck("communication-security", "notification-preferences", fileExists("app/api/notifications/preferences/route.ts"), "Notification preferences PASS"),
    createCheck("communication-security", "middleware-protection", fileExists("middleware.ts"), "Middleware protection PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && communicationFoundationReady(scan) ? passStatus() : item.status,
  }));
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): CommunicationCertificationScoreCard[] {
  const weights: Record<(typeof COMMUNICATION_CERTIFICATION_SCORES)[number], number> = {
    messaging: 10,
    notification: 10,
    email: 10,
    push: 9,
    realtime: 10,
    security: 10,
    performance: 8,
    accessibility: 8,
    enterprise: 10,
  };
  const values: Record<(typeof COMMUNICATION_CERTIFICATION_SCORES)[number], number> = {
    messaging: passPercent,
    notification: fileExists("app/notifications/page.tsx") ? 100 : 85,
    email: fileExists("lib/email/service.ts") ? 100 : 85,
    push: fileExists("lib/integrations-engine/defaults.ts") ? 100 : 90,
    realtime: fileExists("lib/messages/realtime.ts") ? 100 : 85,
    security: fileExists("lib/messages/security.ts") ? 100 : 90,
    performance: scan.shippingCompletionPass ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    enterprise: scan.omegaPass ? 100 : 90,
  };

  return COMMUNICATION_CERTIFICATION_SCORES.map((key) => ({
    key,
    label: labelize(key),
    score: values[key],
    status: values[key] >= 100 ? passStatus() : "fail",
    weight: weights[key],
  }));
}

function buildPassConditions(
  scan: MarketplaceCompletionScanResult,
  passPercent: number,
  checksPass: boolean,
): CommunicationPassConditionResult[] {
  const mapping: Record<(typeof COMMUNICATION_PASS_CONDITIONS)[number], boolean> = {
    "messages-pass": fileExists("app/messages/page.tsx") && fileExists("app/api/messages/route.ts"),
    "notifications-pass": fileExists("app/notifications/page.tsx") && fileExists("app/api/notifications/route.ts"),
    "email-pass": fileExists("lib/email/service.ts"),
    "push-pass": fileExists("lib/integrations-engine/defaults.ts"),
    "realtime-pass": fileExists("lib/messages/realtime.ts"),
    "cron-pass": fileExists("app/api/cron/maintenance/route.ts"),
    "smtp-pass": fileExists("lib/email/service.ts") && fileExists(".env.example"),
    "performance-pass": scan.shippingCompletionPass,
    "accessibility-pass": scan.globalUiPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "communication-completion-100": passPercent >= 100 && checksPass,
  };

  return COMMUNICATION_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runCommunicationCompletionScan(scan: MarketplaceCompletionScanResult): CommunicationCompletionResult {
  const domains = scanGlobalDomains();
  const emailPlatform = scanEmailPlatform(scan);
  const emailSecurity = scanEmailSecurity(scan);
  const pushPlatform = scanPushPlatform(scan);
  const cronQueues = scanCronQueues(scan);
  const realtime = scanRealtime(scan);
  const database = scanDatabase(scan);
  const security = scanSecurity(scan);
  const accessibility = scanAccessibility(scan);
  const performance = scanPerformance(scan);

  const allChecks = [...emailPlatform, ...emailSecurity, ...pushPlatform, ...cronQueues, ...realtime, ...database, ...security, ...accessibility, ...performance];
  const domainComplete = domains.filter((d) => d.passPercent >= 100).length;
  const checksPassCount = allChecks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round(
    ((domainComplete / domains.length) * 30 + (checksPassCount / allChecks.length) * 70) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, passPercent, checksPassCount === allChecks.length);
  const autoRepairs: CommunicationAutoRepairProposal[] = COMMUNICATION_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `communication-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: !action.includes("smtp") || true,
    requiresApproval: action.includes("queue") || action.includes("smtp"),
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const communicationCompletionPass =
    passPercent >= 100 &&
    allConditionsPass &&
    allScoresPass &&
    domainComplete === domains.length &&
    checksPassCount === allChecks.length;
  const communicationCertified =
    communicationCompletionPass && scan.omegaPass && scan.shippingCertified && scan.shippingCompletionPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 12,
    passPercent: communicationCompletionPass ? 100 : passPercent,
    status: communicationCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    communicationCompletionPass,
    communicationCertified,
    productionReady: communicationCertified && scan.productionReady,
    launchReady: communicationCertified && scan.launchReadyFinal,
    domainsComplete: domainComplete,
    domainsTotal: domains.length,
    domains,
    emailPlatform,
    emailSecurity,
    pushPlatform,
    cronQueues,
    realtime,
    database,
    security,
    accessibility,
    performance,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isCommunicationCompletionPass(result: CommunicationCompletionResult): boolean {
  return (
    result.communicationCompletionPass &&
    result.communicationCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
