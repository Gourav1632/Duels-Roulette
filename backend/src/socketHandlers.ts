import { Server } from "socket.io";
import { roomManager } from "./rooms/roomManager";
import { playTurn, initializeGame, startRound } from "../../shared/logic/gameEngine";
import { ActionMessage, Contestant, Player, StatusEffect } from "../../shared/types/types";
import { handlePlayerTurn } from "./rooms/turnManager";
import { emit } from "process";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);

    socket.on("create_room", ({ host, maxPlayer, isPrivate, password, voiceChatEnabled }) => {
        const roomId = Math.random().toString(36).substring(2, 8);
        console.log("Creating room: ", roomId);
        const player: Player = {
          id: host.id,
          name: host.name,
          socketId: socket.id,
        }
        roomManager.createRoom(roomId, player, maxPlayer, isPrivate, password, voiceChatEnabled);
        socket.join(roomId);

        const roomData = roomManager.getRoom(roomId);
        io.to(roomId).emit("room_update", roomData); // broadcast to all in room
        socket.emit("room_created", roomData); // send only to creator
        if(!isPrivate) {
          const publicRooms = roomManager.getPublicRooms();
          io.emit("public_rooms", publicRooms)
        }
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
        socket.emit("error", { message: error.message });
    }
    });

    socket.on("leave_room", ({ roomId, playerId }) => {
    const roomData = roomManager.getRoom(roomId);
    const leavingPlayer = roomData?.players.find(p => p.id === playerId)?.name ?? "A player";
    const newRoomData = roomManager.leaveRoom(roomId, playerId);
    socket.leave(roomId);
    io.to(roomId).emit("room_update", newRoomData ?? null);
    if (newRoomData?.gameState) {
    if( newRoomData.gameState.players.length === 1) { 
      const actionMessage: ActionMessage = {
        type: "message",
        result: `GAME OVER!`,
      };
      newRoomData.gameState.gameState = 'game_over';
      io.to(roomId).emit("game_update", newRoomData.gameState, actionMessage, 5000);
    } else {
      const actionMessage: ActionMessage = {
        type: "announce",
        userId: playerId,
        result: `${leavingPlayer} has left the game.`,
        };
        io.to(roomId).emit("game_update", newRoomData.gameState, actionMessage, 5000);
    }
    }
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
        const gamePlayers: Contestant[] = players.map((p : Player) => ({
          id: p.id,
          name: p.name,
          lives: 3,
          items: [],
          isAI: false,
          isOnline: true,
          statusEffects: [],
        }));

        const initialized = initializeGame(gamePlayers);
        const started = startRound(initialized, 1);
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

        io.to(roomId).emit("game_update", game, roundStartMessage, 10000);

        setTimeout(() => {
          const room = roomManager.getRoom(roomId);
          if(!room || !room.gameState) return;    

          const active = room.gameState.players[room.gameState.activePlayerIndex];

            const turnMessage: ActionMessage = {
              type: "turn",
              userId: active.id,
              result: `It is ${active.name}'s turn.`,
            };

          io.to(roomId).emit("game_update",room.gameState, turnMessage, 2000);


          const result = handlePlayerTurn(roomId, room.gameState)
          if(!result) return;
          room.gameState = result.game;
          
          setTimeout(() => {
            const messageType = result.actionMessage.type;
            if (messageType === 'refill' || messageType === 'error' || messageType === 'announce' || messageType === 'skip') {            
              io.to(roomId).emit("game_update", room.gameState, result.actionMessage, result.delay)
            }

          }, 3000);

        }, 10000);
    })

    socket.on("player_action", ({ roomId, action, delay }) => {
      const room = roomManager.getRoom(roomId);
      if(!room || !room.gameState) return;

      if(action.type === 'steal') {
        const currentGame = room.gameState;
        const activePlayer = currentGame.players[currentGame.activePlayerIndex];
        const targetPlayer = currentGame.players.find((player: Contestant) => player.id === action.targetPlayerId);
        if (!targetPlayer) return;
        const itemIndex = targetPlayer.items.indexOf(action.itemType);
        if (itemIndex === -1) return;

        // simulating stealing by moving the item from target to active player inventory
        targetPlayer.items.splice(itemIndex, 1);
        activePlayer.items.push(action.itemType);

        // Remove "thief" status effect
        activePlayer.statusEffects = activePlayer.statusEffects.filter((effect: StatusEffect) => effect !== "thief");

      }

      const { updatedGame, actionMessage } = playTurn(room.gameState, action);
      room.gameState = updatedGame;

      io.to(roomId).emit("game_update", updatedGame, actionMessage, delay);

      setTimeout(() => {
          const room = roomManager.getRoom(roomId);
          if(!room || !room.gameState) return;    

          const active = room.gameState.players[room.gameState.activePlayerIndex];

            const turnMessage: ActionMessage = {
              type: "turn",
              userId: active.id,
              result: `It is ${active.name}'s turn.`,
            };

          io.to(roomId).emit("game_update",room.gameState, turnMessage, 2000);

          const result = handlePlayerTurn(roomId, room.gameState)
          if(!result) return;
          room.gameState = result.game;

        setTimeout(() => {
            const messageType = result.actionMessage.type;
            if (messageType === 'refill' || messageType === 'error' || messageType === 'announce' || messageType === 'skip' || messageType === 'message') {
              io.to(roomId).emit("game_update", room.gameState, result.actionMessage, result.delay)
            }
          },3000);

      }, delay);
    });
    

    // Voice Chat Signaling
          
      socket.on("voice-join", async ({ roomId }) => {
        console.log(`Socket ${socket.id} joining voice room ${roomId}`);
        socket.join(roomId); // Join the room for WebRTC signaling

        // Notify other users in the room that this user has joined
        socket.to(roomId).emit("voice-user-joined", { userId: socket.id });

      });


      socket.on("voice-offer", ({ to, offer }) => {
        console.log(`🎤 Sending voice offer to ${to}`);
        io.to(to).emit("voice-offer", { from: socket.id, offer });
      });

      socket.on("voice-answer", ({ to, answer }) => {
        io.to(to).emit("voice-answer", { from: socket.id, answer });
      });

      socket.on("voice-candidate", ({ to, candidate }) => {
        io.to(to).emit("voice-candidate", { from: socket.id, candidate });
      });

      socket.on("leave-voice", (roomId: string) => {
          socket.to(roomId).emit("leave-voice", socket.id);
      });




    socket.on("disconnecting", () => {
      console.log(`⚡ Client disconnected: ${socket.id}`);
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      for (const roomId of rooms) {
        roomManager.leaveRoom(roomId, socket.id);
        io.to(roomId).emit("room_update", roomManager.getRoom(roomId));
      }
    });
  });
}


