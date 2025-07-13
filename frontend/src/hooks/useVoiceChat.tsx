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

export const useVoiceChat = (socket: Socket, roomId: string, enabled: boolean) => {
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled || !roomId) return;

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        voiceJoin(socket, roomId);

        // --- Listeners ---
        onVoiceOffer(socket, async ({ from, offer }) => {
          const peer = createPeer(from, socket);
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          sendVoiceAnswer(socket, from, answer);
          stream.getTracks().forEach((track) => peer.addTrack(track, stream));
          peersRef.current[from] = peer;
        });

        onVoiceAnswer(socket, async ({ from, answer }) => {
          const peer = peersRef.current[from];
          if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
        });

        onVoiceCandidate(socket, ({ from, candidate }) => {
          const peer = peersRef.current[from];
          if (peer && candidate) {
            peer.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        onVoiceUserJoined(socket, async ({ userId }) => {

          const peer = createPeer(userId, socket);

          // Add local tracks
          stream.getTracks().forEach((track) => peer.addTrack(track, stream));
          peersRef.current[userId] = peer;

          // ✅ Create and send offer
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
        });
      } catch (err) {
        console.error("🎙️ Microphone access denied or error occurred:", err);
      }
    };

    getMedia();

    return () => {
      // Cleanup
      Object.values(peersRef.current).forEach((peer) => peer.close());
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      leaveVoiceRoom(socket, roomId);

      // Remove listeners manually or via helper
      socket.off("voice-offer");
      socket.off("voice-answer");
      socket.off("voice-candidate");
      socket.off("voice-user-joined");
      socket.off("leave-voice");
    };
  }, [enabled, roomId]);

const createPeer = (userId: string, socket: Socket): RTCPeerConnection => {
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      sendVoiceCandidate(socket, userId, event.candidate);
    }
  };

  peer.ontrack = (event) => {
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    audio.controls = true;
    audio.muted = false;

    audio.play().catch((err) => {
      console.warn("🔇 Autoplay blocked, user interaction required", err);
    });

    document.body.appendChild(audio);
  };

  return peer;
};

};
