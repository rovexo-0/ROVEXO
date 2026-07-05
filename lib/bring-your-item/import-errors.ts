export type ImportErrorRecovery = {
  title: string;
  message: string;
  canRetry: boolean;
  canCancel: boolean;
};

const DEFAULT: ImportErrorRecovery = {
  title: "Import failed",
  message: "Something went wrong while starting your import. Try again or cancel and adjust your source.",
  canRetry: true,
  canCancel: true,
};

const ERROR_MAP: Array<[RegExp, ImportErrorRecovery]> = [
  [
    /network|fetch|failed to fetch|connection/i,
    {
      title: "Network failure",
      message: "We could not reach ROVEXO. Check your connection and retry.",
      canRetry: true,
      canCancel: true,
    },
  ],
  [
    /invalid url|url/i,
    {
      title: "Invalid URL",
      message: "The listing URL does not look valid. Update the link and try again.",
      canRetry: true,
      canCancel: true,
    },
  ],
  [
    /csv|spreadsheet|column|mapping/i,
    {
      title: "Invalid CSV",
      message: "The file could not be parsed. Confirm the format and required columns, then retry.",
      canRetry: true,
      canCancel: true,
    },
  ],
  [
    /timeout|timed out/i,
    {
      title: "Request timed out",
      message: "The import took too long to start. Retry when your connection is stable.",
      canRetry: true,
      canCancel: true,
    },
  ],
  [
    /duplicate/i,
    {
      title: "Duplicate listing detected",
      message: "A matching listing already exists. Review duplicates on the import summary or adjust your source.",
      canRetry: false,
      canCancel: true,
    },
  ],
  [
    /unsupported platform|platform/i,
    {
      title: "Unsupported platform",
      message: "This marketplace is not supported for import yet. Choose another platform.",
      canRetry: false,
      canCancel: true,
    },
  ],
  [
    /unsupported file|file type|mime/i,
    {
      title: "Unsupported file",
      message: "Upload a supported CSV, XLSX, or XML file for this import method.",
      canRetry: true,
      canCancel: true,
    },
  ],
  [
    /unauthorized|authentication|401|403|session|sign in/i,
    {
      title: "Authentication failure",
      message: "Your session expired or access was denied. Sign in again and retry.",
      canRetry: true,
      canCancel: true,
    },
  ],
  [
    /500|server error|internal/i,
    {
      title: "Server error",
      message: "ROVEXO encountered a server error. Wait a moment and retry.",
      canRetry: true,
      canCancel: true,
    },
  ],
];

export function resolveOAuthWizardError(query: {
  oauthFailed: boolean;
  oauthUnconfigured: boolean;
  oauthAuthRequired?: boolean;
  oauthForbidden?: boolean;
  shopRequired: boolean;
}): string | null {
  if (query.oauthFailed) {
    return "Marketplace connection failed. Try connecting again.";
  }
  if (query.oauthUnconfigured) {
    return "This marketplace connection is not configured yet. Contact support or try another platform.";
  }
  if (query.oauthAuthRequired) {
    return "Sign in to connect your marketplace account, then try again.";
  }
  if (query.oauthForbidden) {
    return "Your account cannot connect this marketplace right now. Sign in again or contact support.";
  }
  if (query.shopRequired) {
    return "Enter your Shopify store URL before connecting.";
  }
  return null;
}

export function resolveImportErrorRecovery(error: string | null | undefined): ImportErrorRecovery {
  if (!error?.trim()) return DEFAULT;

  for (const [pattern, recovery] of ERROR_MAP) {
    if (pattern.test(error)) return recovery;
  }

  return { ...DEFAULT, message: error };
}
