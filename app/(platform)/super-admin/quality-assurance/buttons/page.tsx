import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "buttons" as const, title: "Button Validation Engine", description: "Register and validate every interactive element through the full validation chain." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Buttons"); }
