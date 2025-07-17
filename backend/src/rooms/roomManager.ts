// backend/src/utils/roomManager.ts
import { Contestant, GameState, Player, RoomData } from "../../../shared/types/types";

class RoomManager {
  private rooms: Map<string, RoomData> = new Map();
  createRoom(roomId: string, host: Player, maxPlayers: number, isPrivate: boolean, password: string, voiceChatEnabled: boolean = false) {
    if (this.rooms.has(roomId)) throw new Error('Room already exists');
    this.rooms.set(roomId, {
        id: roomId,
        host: host,
        players: [host],
        maxPlayers: maxPlayers,
        isPrivate: isPrivate,
        password: password,
        gameState: null,
        voiceChatEnabled: voiceChatEnabled, 
    });
  }

joinRoom(roomId: string, player: Player, password?: string) {
  const room = this.rooms.get(roomId);
  if (!room) throw new Error('Room not found. Please refresh to fetch new rooms.');

  if (room.isPrivate && password !== room.password) {
    throw new Error('Incorrect password');
  }

  const alreadyJoined = room.players.some(p => p.id === player.id);
  if (alreadyJoined) {
    throw new Error('Player already in room');
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error('Room is full');
  }

  room.players.push(player);
}

leaveRoom(roomId: string, playerId: string): RoomData | undefined {
  const room = this.rooms.get(roomId);
  if (!room) return;  

  // If gameState exists, handle removal from game logic
  if (room.gameState) {
    const gamePlayers = room.gameState.players;
    const indexOfLeavingPlayer = gamePlayers.findIndex(p => p.id === playerId);
    const currentIndex = room.gameState.activePlayerIndex;

    // Remove player from gameState
    room.gameState.players = gamePlayers.filter(p => p.id !== playerId);

    // Update turn if necessary
    if (indexOfLeavingPlayer === currentIndex) {
      room.gameState.activePlayerIndex %= room.gameState.players.length;
    } else if (indexOfLeavingPlayer < currentIndex) {
      room.gameState.activePlayerIndex -= 1;
    }
  }

  // Remove from general player list
  room.players = room.players.filter(p => p.id !== playerId);

  // Remove room if empty
  if (room.players.length === 0) {
    this.rooms.delete(roomId);
    console.log("room empty");
    return;
  }

  // Reassign host if host left
  if (room.host.id === playerId) {
    room.host = room.players[0];
  }

  return room;
}

 
  getPublicRooms() {
  return Array.from(this.rooms.entries())
    .filter(([_, room]) => !room.isPrivate && room.players.length < room.maxPlayers && room.gameState === null)
    .map(([id, room]) => ({
      id,
      host: room.host,
      playersActive: room.players.length,
      maxPlayers: room.maxPlayers,
      voiceChatEnabled: room.voiceChatEnabled,
    }));
}

  getRoom(roomId: string): RoomData | undefined {
    return this.rooms.get(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.entries());
  }

  updateGameState(roomId: string, gameState: GameState) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    room.gameState = gameState;
  }

  removeRoom(roomId: string) {
    this.rooms.delete(roomId);
  }

  playerExists(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    return !!room?.players.some(p => p.id === playerId);
  }
}

export const roomManager = new RoomManager();
