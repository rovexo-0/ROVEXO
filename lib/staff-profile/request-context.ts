export type ParsedUserAgent = {
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
};

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const ua = userAgent?.trim() ?? "";
  if (!ua) {
    return { browser: null, operatingSystem: null, device: null };
  }

  let browser: string | null = null;
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  let operatingSystem: string | null = null;
  if (/Windows NT/i.test(ua)) operatingSystem = "Windows";
  else if (/Mac OS X/i.test(ua)) operatingSystem = "macOS";
  else if (/Android/i.test(ua)) operatingSystem = "Android";
  else if (/iPhone|iPad/i.test(ua)) operatingSystem = "iOS";
  else if (/Linux/i.test(ua)) operatingSystem = "Linux";

  let device: string | null = "Desktop";
  if (/Mobile/i.test(ua)) device = "Mobile";
  else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

  return { browser, operatingSystem, device };
}

export function readRequestClientContext(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  return {
    ipAddress: ipAddress ?? null,
    userAgent: request.headers.get("user-agent"),
  };
}

export function toStaffActionContext(
  actorId: string,
  request: Request,
): { actorId: string; ipAddress: string | null; userAgent: string | null } {
  const client = readRequestClientContext(request);
  return { actorId, ...client };
}
