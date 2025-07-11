import { io, Socket } from "socket.io-client";
import type { ActionMessage, GameState, RoomData } from "../../../shared/types/types";

const URL = "http://localhost:3001";
export const socket: Socket = io(URL, {
    autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
});

// --- Emitters ---

export const createRoom = (host:{id:string, name:string}, maxPlayer: number, isPrivate : boolean, password : string = "") => {
    socket.emit("create_room", {host , maxPlayer, isPrivate, password});
} 

export const joinRoom = (roomId: string, player: {id:string, name:string}, password?: string) => {
  socket.emit("join_room", { roomId, player, password });
};

export const fetchPublicRooms = () =>{
    socket.emit("fetch_rooms");
}

export const emitPlayerAction = (roomId: string, action: ActionMessage, delay: number) => {
  socket.emit("player_action", { roomId, action, delay});
};

export const leaveRoom = (roomId: string, player: {id:string, name:string}) => {
  socket.emit("leave_room", { roomId, player });
};

export const startGame = (roomId: string) => {
    socket.emit("start_game", {roomId});
} 

export const gameReady = (roomId: string) => {
  socket.emit("game_ready",{roomId});
}

// Add more emitters if needed...


// --- Listeners ---

export const onGameUpdate = (callback: (game: GameState, action : ActionMessage, delay: number) => void) => {
  socket.on("game_update", callback);
};

export const onRoomUpdate = (callback: (roomData: RoomData) => void) => {
  socket.on("room_update", callback);
};

export const onError = (callback: (err: {message:string}) => void) => {
  socket.on("error", callback);
};

export const onRoomCreate = (callback: (roomData: RoomData) => void) => {
    socket.on("room_created", callback);
}

export const onPublicRoomsReceived = (callback: (publicRooms: RoomData[]) => void) => {
    socket.on("public_rooms", callback);
}

export const onGameStarted = (callback: (roomData: RoomData)=> void) => {
    socket.on("game_started", callback);
};


// You can also expose a cleanup function
export const clearSocketListeners = () => {
  socket.off("game_update");
  socket.off("room_update");
  socket.off("error");
};


