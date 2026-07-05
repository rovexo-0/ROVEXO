export {
  answerStaffCall,
  declineStaffCall,
  endStaffCall,
  initiateStaffCall,
  listStaffCallHistory,
  markStaffCallMissed,
  persistStaffCallSignal,
  transferStaffCall,
  updateCallParticipantMedia,
  type StaffCallType,
} from "@/lib/staff-comms/calls";

export {
  attachStaffMessageFile,
  createStaffUploadPath,
  validateStaffAttachment,
} from "@/lib/staff-comms/files";

export {
  bookmarkStaffMessage,
  createDepartmentChannel,
  listStaffTyping,
  markStaffMessageRead,
  pinStaffMessage,
  searchStaffMessages,
  sendStaffMessageEnhanced,
  setStaffTyping,
} from "@/lib/staff-comms/messages";

export {
  cacheStaffDirectorySnapshot,
  queueStaffOfflineAction,
  syncStaffOfflineQueue,
} from "@/lib/staff-comms/offline";

export {
  broadcastStaffCallSignal,
  createStaffPeerConnection,
  STAFF_WEBRTC_ICE_SERVERS,
  subscribeStaffCallBroadcast,
  subscribeStaffCallSignals,
  subscribeStaffMessages,
  subscribeStaffPresence,
  subscribeStaffTyping,
} from "@/lib/staff-comms/webrtc-client";
