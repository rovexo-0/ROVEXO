export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  return Boolean(secret && authHeader === `Bearer ${secret}`);
}
