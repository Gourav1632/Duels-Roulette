import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import {
  voiceJoin,
  sendVoiceAnswer,
  sendVoiceCandidate,
  leaveVoiceRoom,
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

    // Add diagnostic logs for connection state
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
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        voiceJoin(socket, roomId);

        onVoiceOffer(socket, async ({ from, offer }) => {
          let peer = peersRef.current[from];
          if (!peer) {
            peer = createPeer(from, socket);
            peersRef.current[from] = peer;
            stream.getTracks().forEach((t) => peer!.addTrack(t, stream));
          }

          await peer.setRemoteDescription(offer);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          sendVoiceAnswer(socket, from, answer);
        });

        onVoiceAnswer(socket, async ({ from, answer }) => {
          const peer = peersRef.current[from];
          if (peer) {
            await peer.setRemoteDescription(answer);
          }
        });

        onVoiceCandidate(socket, ({ from, candidate }) => {
          const peer = peersRef.current[from];
          if (peer && candidate) {
            peer.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        onVoiceUserJoined(socket, async ({ userId }) => {
          if (peersRef.current[userId]) return;

          const peer = createPeer(userId, socket);
          peersRef.current[userId] = peer;

          stream.getTracks().forEach((t) => peer.addTrack(t, stream));
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          sendVoiceOffer(socket, userId, offer);
        });

        onVoiceLeave(socket, (userId) => {
          const peer = peersRef.current[userId];
          if (peer) {
            peer.close();
            delete peersRef.current[userId];
          }
          const audio = document.getElementById(`audio-${userId}`);
          if (audio) audio.remove();
        });
      } catch (err) {
        console.error("Microphone access error:", err);
      }
    };

    getMediaAndSetup();

    return () => {
      Object.values(peersRef.current).forEach((p) => p.close());
      peersRef.current = {};

      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      leaveVoiceRoom(socket, roomId);

      document.querySelectorAll("audio[id^='audio-']").forEach((a) => a.remove());

      socket.off("voice-offer");
      socket.off("voice-answer");
      socket.off("voice-candidate");
      socket.off("voice-user-joined");
      socket.off("leave-voice");
    };
  }, [enabled, roomId, socket]);
};
