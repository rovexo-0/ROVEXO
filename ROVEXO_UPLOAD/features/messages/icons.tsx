import type { MessageStatus } from "@/lib/messages/types";
import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import { createFluencyFeatureIcon } from "@/components/icons/fluency-3d-feature";

export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  const key =
    status === "read"
      ? "feature-message-read"
      : status === "delivered"
        ? "feature-message-delivered"
        : "feature-message-sent";

  return <Fluency3DIcon icon={key} size={14} />;
}

export const SearchIcon = createFluencyFeatureIcon("feature-message-search");
export const MoreIcon = createFluencyFeatureIcon("feature-message-more");
export const EmptyMessagesIcon = createFluencyFeatureIcon("feature-message-empty", 48);
export const PlusIcon = createFluencyFeatureIcon("feature-message-plus");
export const CameraIcon = createFluencyFeatureIcon("feature-message-camera");
