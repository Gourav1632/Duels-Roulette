import { Server } from "socket.io";
import { roomManager } from "./rooms/roomManager";
import {
  playTurn,
  startRound,
  initializeGame,
} from "../../shared/logic/gameEngine";
import { ActionMessage, Contestant, Player } from "@shared/types/types";
import { handlePlayerTurn } from "./rooms/turnManager";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);

    socket.on("create_room", ({ host, maxPlayer, isPrivate, password }) => {
        const roomId = Math.random().toString(36).substring(2, 8);
        console.log("Creating room: ", roomId);
        const player: Player = {
          id: host.id,
          name: host.name,
          socketId: socket.id,
        }
        roomManager.createRoom(roomId, player, maxPlayer, isPrivate, password);
        socket.join(roomId);

        const roomData = roomManager.getRoom(roomId);
        io.to(roomId).emit("room_update", roomData); // broadcast to all in room
        socket.emit("room_created", roomData); // send only to creator
    });

    socket.on("join_room", ({ roomId, player, password }) => {
    try {
        const newPlayer: Player = {
          id: player.id,
          name: player.name,
          socketId: socket.id,
        }
        roomManager.joinRoom(roomId, newPlayer, password);
        socket.join(roomId);
        io.to(roomId).emit("room_update", roomManager.getRoom(roomId));
    } catch (error: any) {
        console.error("Join room error:", error.message);
        io.to(roomId).emit("error", { message: error.message });
    }
    });

    socket.on("leave_room", ({ roomId, player }) => {
    const roomData = roomManager.leaveRoom(roomId, player.id);
    socket.leave(roomId);
    io.to(roomId).emit("room_update", roomData ?? null);
    });



    socket.on("fetch_rooms", () => {
    console.log("fetching rooms...");
    const publicRooms = roomManager.getPublicRooms();

    socket.emit("public_rooms", publicRooms);
    });


    socket.on("start_game", ({roomId})=>{
        console.log("Starting game...");
        const room = roomManager.getRoom(roomId);
        if(!room){
          console.log("no room");
          return;
        } 
        const players = room.players;
        const gamePlayers: Contestant[] = players.map((p) => ({
          id: p.id,
          name: p.name,
          lives: 3,
          items: [],
          isAI: false,
          isOnline: true,
          statusEffects: [],
        }));

        const initialized = initializeGame(gamePlayers);
        const started = startRound(initialized, 3);
        room.gameState = started;

        io.to(roomId).emit("game_started", room);


      });

    socket.on("game_ready", ({roomId}) =>{
        const room = roomManager.getRoom(roomId);
        const game = room?.gameState;
        if(!room || !game) return;
        const { poisnousGoblets, holyGoblets } = game.currentRound;
        const currentTurnId = room.gameState?.players[room.gameState.activePlayerIndex].id;
        const roundStartMessage: ActionMessage = {
          type: 'announce',
          userId: currentTurnId,
          result: `Round ${game.currentRound.round} starts with ${poisnousGoblets} poisoned and ${holyGoblets} holy goblets.`
        };

        io.to(roomId).emit("game_update", game, roundStartMessage, 5000);

        setTimeout(() => {
          const room = roomManager.getRoom(roomId);
          if(!room || !room.gameState) return;    

          const active = room.gameState.players[room.gameState.activePlayerIndex];
          room.players.forEach((player) => {
            const isActive = player.id === active.id;
            const turnMessage: ActionMessage = {
              type: "message",
              userId: active.id,
              result: isActive
                ? `It is your turn.`
                : `It is ${active.name}'s turn.`,
            };
            io.to(player.socketId).emit("game_update", room.gameState, turnMessage, 2000);
          });


          const result = handlePlayerTurn(roomId, room.gameState)
          if(!result) return;
          room.gameState = result.game;
          
          setTimeout(() => {
            const messageType = result.actionMessage.type;
            if (messageType === 'refill' || messageType === 'error' || messageType === 'announce' || messageType === 'skip') {
              io.to(roomId).emit("game_update", room.gameState, result.actionMessage, result.delay)
            }

          }, 2000);

        }, 5000);
    })

    socket.on("player_action", ({ roomId, action, delay }) => {
      const room = roomManager.getRoom(roomId);
      if(!room || !room.gameState) return;

      if(action.type === 'steal') {
        const currentGame = room.gameState;
        const activePlayer = currentGame.players[currentGame.activePlayerIndex];
        const targetPlayer = currentGame.players.find(player => player.id === action.targetPlayerId);
        if (!targetPlayer) return;
        const itemIndex = targetPlayer.items.indexOf(action.itemType);
        if (itemIndex === -1) return;

        // simulating stealing by moving the item from target to active player inventory
        targetPlayer.items.splice(itemIndex, 1);
        activePlayer.items.push(action.itemType);

        // Remove "thief" status effect
        activePlayer.statusEffects = activePlayer.statusEffects.filter(effect => effect !== "thief");

      }

      const { updatedGame, actionMessage } = playTurn(room.gameState, action);
      room.gameState = updatedGame;

      io.to(roomId).emit("game_update", updatedGame, actionMessage, delay);

      setTimeout(() => {
          const room = roomManager.getRoom(roomId);
          if(!room || !room.gameState) return;    

          const active = room.gameState.players[room.gameState.activePlayerIndex];
          room.players.forEach((player) => {
            const isActive = player.id === active.id;
            const turnMessage: ActionMessage = {
              type: "message",
              userId: active.id,
              result: isActive
                ? `It is your turn.`
                : `It is ${active.name}'s turn.`,
            };
            io.to(player.socketId).emit("game_update", room.gameState, turnMessage, 2000);
          });


          const result = handlePlayerTurn(roomId, room.gameState)
          if(!result) return;
          room.gameState = result.game;

        setTimeout(() => {
            const messageType = result.actionMessage.type;
            if (messageType === 'refill' || messageType === 'error' || messageType === 'announce' || messageType === 'skip') {
              io.to(roomId).emit("game_update", room.gameState, result.actionMessage, result.delay)
            }
          },2000);

      }, delay);
    });

    socket.on("disconnecting", () => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      for (const roomId of rooms) {
        roomManager.leaveRoom(roomId, socket.id);
        io.to(roomId).emit("room_update", roomManager.getRoom(roomId));
      }
    });
  });
}


