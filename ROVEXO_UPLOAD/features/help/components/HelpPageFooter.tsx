import { NeedHelpLink } from "@/features/help/components/NeedHelpLink";

type HelpPageFooterProps = {
  pathname: string;
};

export function HelpPageFooter({ pathname }: HelpPageFooterProps) {
  return (
    <div className="border-t border-border px-ds-4 py-ds-3 text-center">
      <NeedHelpLink pathname={pathname} />
    </div>
  );
}
