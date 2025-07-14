import React, { createContext, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";

import SinglePlayerMode from "./pages/SinglePlayerMode";
import HowToPlay from "./pages/HotToPlay";
import Lore from "./pages/Lore";
import Credits from "./pages/Credits";

import { MusicProvider } from "./context/MusicContext";
import { SocketProvider } from "./context/SocketContext";
import { VoiceChatProvider } from "./context/VoiceChatContext";
import {
  HomeRouteHandler,
  MultiplayerLobbyWrapper,
  MultiPlayerModeWrapper,
} from "./RouteWrappers";
import type { RoomData } from "../../shared/types/types";
import "./index.css";

// Global App State Context
export const AppStateContext = createContext<{
  roomData: RoomData | null;
  setRoomData: React.Dispatch<React.SetStateAction<RoomData | null>>;
  myPlayerId: string | null;
  setMyPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
} | null>(null);

// Root layout wrapper with all providers
const AppLayout = () => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  return (
    <AppStateContext.Provider
      value={{ roomData, setRoomData, myPlayerId, setMyPlayerId }}
    >
      <MusicProvider>
        <SocketProvider>
          <VoiceChatProvider
            roomId={roomData?.id ?? ""}
            voiceChatEnabled={roomData?.voiceChatEnabled ?? false}
          >
            <Outlet />
          </VoiceChatProvider>
        </SocketProvider>
      </MusicProvider>
    </AppStateContext.Provider>
  );
};

// Browser router with nested routing
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomeRouteHandler /> },
      { path: "singleplayer", element: <SinglePlayerMode /> },
      { path: "multiplayerlobby", element: <MultiplayerLobbyWrapper /> },
      { path: "multiplayer", element: <MultiPlayerModeWrapper /> },
      { path: "how-to-play", element: <HowToPlay /> },
      { path: "lore", element: <Lore /> },
      { path: "credits", element: <Credits /> },
    ],
  },
]);

// Final render
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
