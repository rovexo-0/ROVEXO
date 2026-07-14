"use client";

import type { ReactNode } from "react";
import {
  Ban,
  Bell,
  Cookie,
  CreditCard,
  Download,
  Eye,
  FileText,
  Flag,
  Hash,
  HelpCircle,
  Info,
  Landmark,
  Lock,
  Mail,
  MessageCircle,
  Percent,
  Phone,
  Scale,
  ScrollText,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";

const LUCIDE_PROPS = {
  size: 20,
  strokeWidth: 1.75,
  "aria-hidden": true,
} as const;

export function SettingsMenuIconGlyph({
  name,
  danger = false,
}: {
  name: SettingsMenuIcon;
  danger?: boolean;
}) {
  const className = danger ? "settings-canonical__danger-icon" : undefined;
  return (
    <span className="cds-menu-row__icon" aria-hidden>
      <span className={className}>{resolveSettingsMenuIcon(name)}</span>
    </span>
  );
}

function resolveSettingsMenuIcon(name: SettingsMenuIcon): ReactNode {
  switch (name) {
    case "mail":
      return <Mail {...LUCIDE_PROPS} />;
    case "phone":
      return <Phone {...LUCIDE_PROPS} />;
    case "user":
      return <User {...LUCIDE_PROPS} />;
    case "lock":
      return <Lock {...LUCIDE_PROPS} />;
    case "shield":
      return <Shield {...LUCIDE_PROPS} />;
    case "eye":
      return <Eye {...LUCIDE_PROPS} />;
    case "ban":
      return <Ban {...LUCIDE_PROPS} />;
    case "download":
      return <Download {...LUCIDE_PROPS} />;
    case "trash":
      return <Trash2 {...LUCIDE_PROPS} />;
    case "bell":
      return <Bell {...LUCIDE_PROPS} />;
    case "credit-card":
      return <CreditCard {...LUCIDE_PROPS} />;
    case "landmark":
      return <Landmark {...LUCIDE_PROPS} />;
    case "percent":
      return <Percent {...LUCIDE_PROPS} />;
    case "file-text":
      return <FileText {...LUCIDE_PROPS} />;
    case "scroll-text":
      return <ScrollText {...LUCIDE_PROPS} />;
    case "cookie":
      return <Cookie {...LUCIDE_PROPS} />;
    case "scale":
      return <Scale {...LUCIDE_PROPS} />;
    case "help-circle":
      return <HelpCircle {...LUCIDE_PROPS} />;
    case "message-circle":
      return <MessageCircle {...LUCIDE_PROPS} />;
    case "flag":
      return <Flag {...LUCIDE_PROPS} />;
    case "info":
      return <Info {...LUCIDE_PROPS} />;
    case "hash":
      return <Hash {...LUCIDE_PROPS} />;
    default:
      return <Info {...LUCIDE_PROPS} />;
  }
}
