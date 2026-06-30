import { renderLaunchReadinessPage, launchReadinessMetadata } from "@/lib/enterprise-launch-readiness-engine/page";

const props = { tab: "email" as const, title: "Email", description: "SMTP, transactional emails, queue, templates and delivery validation." };
export default async function Page() { return renderLaunchReadinessPage(props); }
export async function generateMetadata() { return launchReadinessMetadata("Email"); }
