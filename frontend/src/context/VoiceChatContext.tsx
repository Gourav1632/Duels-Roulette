import { useVoiceChat } from "../hooks/useVoiceChat";
import { useSocket } from "./SocketContext";

export const VoiceChatProvider = ({
  roomId,
  voiceChatEnabled,
  children,
}: {
  roomId: string;
  voiceChatEnabled: boolean;
  children: React.ReactNode;
}) => {
  const socket = useSocket(); // ⬅️ get socket from context
  useVoiceChat(socket, roomId, voiceChatEnabled);

  return <>{children}</>;
};
