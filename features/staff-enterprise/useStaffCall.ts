"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  broadcastStaffCallSignal,
  createStaffPeerConnection,
  subscribeStaffCallSignals,
  STAFF_WEBRTC_ICE_SERVERS,
} from "@/lib/staff-comms/webrtc-client";

type CallState = "idle" | "ringing" | "active" | "ended";

type UseStaffCallOptions = {
  staffId: string;
  onIncomingCall?: (callId: string, callType: string) => void;
};

export function useStaffCall({ staffId, onIncomingCall }: UseStaffCallOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const persistSignal = useCallback(
    async (callId: string, signalType: string, payload: Record<string, unknown>, targetStaffId?: string) => {
      await fetch("/api/staff-enterprise/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signal",
          callId,
          signalType,
          payload,
          targetStaffId,
        }),
      });
      await broadcastStaffCallSignal(callId, { signalType, payload, targetStaffId, senderStaffId: staffId });
    },
    [staffId],
  );

  const attachLocalMedia = useCallback(async (withVideo: boolean) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: withVideo ? { facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const setupPeer = useCallback(
    async (callId: string, withVideo: boolean) => {
      const pc = await createStaffPeerConnection();
      peerRef.current = pc;
      const local = await attachLocalMedia(withVideo);
      local.getTracks().forEach((track) => pc.addTrack(track, local));

      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? null;
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          void persistSignal(callId, "ice", event.candidate.toJSON() as Record<string, unknown>);
        }
      };

      return pc;
    },
    [attachLocalMedia, persistSignal],
  );

  const initiateCall = useCallback(
    async (participantStaffIds: string[], callType: "voice" | "video" | "conference" = "voice") => {
      const response = await fetch("/api/staff-enterprise/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          callType,
          participantStaffIds,
          recordingEnabled: recording,
        }),
      });
      const payload = (await response.json()) as { callId?: string; error?: string };
      if (!response.ok || !payload.callId) throw new Error(payload.error ?? "Call failed.");

      setActiveCallId(payload.callId);
      setCallState("ringing");

      const pc = await setupPeer(payload.callId, callType !== "voice");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await persistSignal(payload.callId, "offer", { sdp: offer.sdp, type: offer.type });

      return payload.callId;
    },
    [persistSignal, recording, setupPeer],
  );

  const answerCall = useCallback(
    async (callId: string, withVideo = false) => {
      await fetch("/api/staff-enterprise/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", callId }),
      });

      const pc = await setupPeer(callId, withVideo);
      setActiveCallId(callId);
      setCallState("active");
      return pc;
    },
    [setupPeer],
  );

  const endCall = useCallback(async () => {
    if (!activeCallId) return;
    await fetch("/api/staff-enterprise/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", callId: activeCallId, reason: "ended" }),
    });
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    mediaRecorderRef.current?.stop();
    setCallState("ended");
    setActiveCallId(null);
  }, [activeCallId]);

  const transferCall = useCallback(
    async (targetStaffId: string) => {
      if (!activeCallId) return;
      await fetch("/api/staff-enterprise/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transfer", callId: activeCallId, targetStaffId }),
      });
    },
    [activeCallId],
  );

  const toggleMute = useCallback(async () => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
    if (activeCallId) {
      await fetch("/api/staff-enterprise/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "media", callId: activeCallId, muted: next }),
      });
    }
  }, [activeCallId, muted]);

  const toggleVideo = useCallback(async () => {
    const next = !videoEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setVideoEnabled(next);
    if (activeCallId) {
      await fetch("/api/staff-enterprise/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "media", callId: activeCallId, videoEnabled: next }),
      });
    }
  }, [activeCallId, videoEnabled]);

  const toggleSpeaker = useCallback(async () => {
    const next = !speakerEnabled;
    setSpeakerEnabled(next);
    if (activeCallId) {
      await fetch("/api/staff-enterprise/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "media", callId: activeCallId, speakerEnabled: next }),
      });
    }
  }, [activeCallId, speakerEnabled]);

  const startRecording = useCallback(() => {
    if (!localStreamRef.current || mediaRecorderRef.current) return;
    const recorder = new MediaRecorder(localStreamRef.current);
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  }, []);

  useEffect(() => {
    if (!staffId) return;
    const channel = subscribeStaffCallSignals(activeCallId ?? "incoming", staffId, async (row) => {
      const signalType = String(row.signal_type);
      const payload = row.payload as Record<string, unknown>;
      const callId = String(row.call_id);

      if (signalType === "offer" && !activeCallId) {
        onIncomingCall?.(callId, "voice");
        return;
      }

      const pc = peerRef.current ?? (await setupPeer(callId, false));
      if (signalType === "offer" && payload.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: String(payload.sdp) }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await persistSignal(callId, "answer", { sdp: answer.sdp, type: answer.type });
        setCallState("active");
      } else if (signalType === "answer" && payload.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: String(payload.sdp) }));
        setCallState("active");
      } else if (signalType === "ice" && payload.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
      }
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [activeCallId, onIncomingCall, persistSignal, setupPeer, staffId]);

  return {
    callState,
    activeCallId,
    muted,
    videoEnabled,
    speakerEnabled,
    recording,
    localStream,
    remoteStream,
    iceServers: STAFF_WEBRTC_ICE_SERVERS,
    initiateCall,
    answerCall,
    endCall,
    transferCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    startRecording,
  };
}
