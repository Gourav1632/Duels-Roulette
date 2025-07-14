// AppLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppStateContext from "./context/AppStateContext";
import { MusicProvider } from "./context/MusicContext";
import type { RoomData } from "../../shared/types/types";

const AppLayout = () => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  return (
    <AppStateContext.Provider value={{ roomData, setRoomData, myPlayerId, setMyPlayerId }}>
      <MusicProvider>
        <Outlet />
      </MusicProvider>
    </AppStateContext.Provider>
  );
};

export default AppLayout;
