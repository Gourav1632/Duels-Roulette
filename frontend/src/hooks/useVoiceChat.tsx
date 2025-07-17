import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import {
  sendVoiceAnswer,
  sendVoiceCandidate,
  onVoiceOffer,
  onVoiceAnswer,
  onVoiceCandidate,
  onVoiceUserJoined,
  onVoiceLeave,
  sendVoiceOffer,
} from "../utils/socket";

export const useVoiceChat = (
  socket: Socket,
  roomId: string,
  enabled: boolean
) => {
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeer = (userId: string, socket: Socket) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
        {
          urls: "turn:relay.metered.ca:443",
          username: "openai",
          credential: "chatgpt",
        },
      ],
    });

    peer.onicecandidate = (ev) => {
      if (ev.candidate) {
        sendVoiceCandidate(socket, userId, ev.candidate);
      }
    };

    peer.ontrack = (ev) => {
      const audio = document.createElement("audio");
      audio.id = `audio-${userId}`;
      audio.srcObject = ev.streams[0];
      audio.autoplay = true;
      audio.muted = false;
      audio.play().catch(() => {});
      document.body.appendChild(audio);
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === "failed") {
        console.warn(`❌ ICE connection failed with ${userId}`);
      }
    };

    return peer;
  };

  useEffect(() => {
    if (!enabled || !roomId) return;

    const getMediaAndSetup = async () => {
      // ✅ Set up listeners BEFORE getUserMedia
      onVoiceOffer(socket, async ({ from, offer }) => {
        console.log("📥 Received voice offer from", from);
        let peer = peersRef.current[from];
        if (!peer) {
          peer = createPeer(from, socket);
          peersRef.current[from] = peer;
          localStreamRef.current?.getTracks().forEach((t) =>
            peer!.addTrack(t, localStreamRef.current!)
          );
        }

        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        console.log("📤 Sending voice answer to", from);
        sendVoiceAnswer(socket, from, answer);
      });

      onVoiceAnswer(socket, async ({ from, answer }) => {
        console.log("✅ Received voice answer from", from);
        const peer = peersRef.current[from];
        if (peer) {
          await peer.setRemoteDescription(answer);
        }
      });

      onVoiceCandidate(socket, ({ from, candidate }) => {
        console.log("➕ Received ICE candidate from", from);
        const peer = peersRef.current[from];
        if (peer && candidate) {
          peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      onVoiceLeave(socket, (userId) => {
        console.log("👋 Received leave-voice for", userId);
        const peer = peersRef.current[userId];
        if (peer) {
          peer.close();
          delete peersRef.current[userId];
        }
        const audio = document.getElementById(`audio-${userId}`);
        if (audio) audio.remove();
      });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        onVoiceUserJoined(socket, async ({ userId }) => {
          if (peersRef.current[userId]) return;
          console.log("👤 Voice user joined", userId);
          const peer = createPeer(userId, socket);
          peersRef.current[userId] = peer;

          stream.getTracks().forEach((t) => peer.addTrack(t, stream));
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          console.log("📤 Sending voice offer to", userId);
          sendVoiceOffer(socket, userId, offer);
        });
      } catch (err) {
        console.error("🚫 Microphone access error:", err);
      }
    };

    getMediaAndSetup();

    return () => {
      // Close all peer connections
      Object.values(peersRef.current).forEach((p) => p.close());
      peersRef.current = {};

      // Stop local audio stream
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      // Remove audio elements
      document.querySelectorAll("audio[id^='audio-']").forEach((a) => a.remove());

      // Clean up event listeners
      socket.off("voice-offer");
      socket.off("voice-answer");
      socket.off("voice-candidate");
      socket.off("voice-user-joined");
      socket.off("leave-voice");
    };
  }, [enabled, roomId, socket]);
};
