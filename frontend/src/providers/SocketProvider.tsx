
import { useEffect, useRef, useState } from "react";
import { SocketContext } from "../contexts/SocketContext";
import { Socket, io } from "socket.io-client";
const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";


export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket>(io(URL, { autoConnect: false, transports: ["websocket"] }));
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) socket.connect();

    socket.on("connected", (socketId: string) => {
      setSocketId(socketId);
    });


    return () => {
      socket.off("connected");
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, socketId }}>
      {children}
    </SocketContext.Provider>
  );
};