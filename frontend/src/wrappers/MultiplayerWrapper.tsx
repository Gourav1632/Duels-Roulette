// RouteWrappers/MultiplayerWrapper.tsx
import { useContext } from "react";
import { Outlet } from "react-router-dom";
import AppStateContext from "../context/AppStateContext";
import { SocketProvider } from "../context/SocketContext";
import { VoiceChatProvider } from "../context/VoiceChatContext";

const MultiplayerWrapper = () => {
  const state = useContext(AppStateContext);
  if (!state) return null;

  const { roomData } = state;
  const roomId = roomData?.id ?? "";
  const voiceChatEnabled = roomData?.voiceChatEnabled ?? false;

  return (
    <SocketProvider>
      <VoiceChatProvider roomId={roomId} voiceChatEnabled={voiceChatEnabled}>
        <Outlet />
      </VoiceChatProvider>
    </SocketProvider>
  );
};

export default MultiplayerWrapper;
