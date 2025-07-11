import { useState, useEffect,  } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, onRoomCreate, onRoomUpdate, fetchPublicRooms, onPublicRoomsReceived, joinRoom, onError, leaveRoom, startGame, onGameStarted} from "../utils/socket";
import { v4 as uuidv4 } from "uuid";
import type { RoomData } from "../../../shared/types/types";
import { socket } from "../utils/socket";

const MultiplayerLobby = ({setRoomData, setMyPlayerId}:{setRoomData: (roomData: RoomData) => void ; setMyPlayerId: (myPlayerId : string | null) => void}) => {
  const [mode, setMode] = useState<"default" | "create" | "join">("default");
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [publicRooms, setPublicRooms] = useState<RoomData[] >([]);
  const [errorMessage, setErrorMessage] = useState<string>("");


useEffect(() => {
  if (!socket.connected) {
    socket.connect();
  }

  onRoomCreate((roomData) =>{
    setRoom(roomData);
    setRoomData(roomData);
    setMode("create");
  })

  onRoomUpdate((roomData) =>{
    setRoom(roomData);
    setRoomData(roomData);
    if(roomData) {
        setMode("create");
    } else {
        setMode("default");
    }
  })

  onPublicRoomsReceived((publicRooms)=>{
    setPublicRooms(publicRooms);
  })

  onError((error) => {
    setErrorMessage(error.message);
  })

  onGameStarted((roomData)=>{
    setRoomData(roomData);
    navigate("/multiplayer");
  })

  // Cleanup on unmount
  return () => {
    socket.off("game_started");
    socket.off("room_created");
    socket.off("room_update");
    socket.off("public_rooms");
  };
}, []);


  function handleCreateRoom() {
    const host = {
      id: uuidv4(),
      name: name,
    };
    setPlayerId(host.id);
    setMyPlayerId(host.id);
    createRoom(host, maxPlayers, isPrivate, password);
  }

  function handlePublicRooms() {
      setMode("join");
      fetchPublicRooms();
  }

function handleJoinRoom(roomId: string, name: string, password?: string, isPrivate: boolean = false) {
  if (!name || (isPrivate && !password)) {
    setErrorMessage(isPrivate ? "Please enter name and password" : "Please enter name");
    return;
  }

  const player = {
    id: uuidv4(),
    name: name,
  };
  setPlayerId(player.id);
  setMyPlayerId(player.id);
  joinRoom(roomId, player, password); 
}

function handleLeaveRoom() {
    if (!room || !playerId) return;
    const player = {
        id: playerId, 
        name: name,
    }
    leaveRoom(room.id, player);
    setRoom(null);
    setRoomId("");
    setMode("default");
}

function handleStartGame() {
    if(!room) return;
    startGame(room.id);
};



  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl p-6 rounded-lg border border-yellow-600 shadow-xl bg-zinc-900">
        <h1 className="text-3xl font-bold mb-6 text-center font-gothic tracking-wide">
          Multiplayer Lobby
        </h1>

        {/* ------------------- ROOM LOBBY ------------------- */}
        {room ? (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-yellow-400">Room ID: {room.id}</h2>
              <p className="text-sm text-gray-300">
                {room.isPrivate ? "🔒 Private Room" : "🌐 Public Room"}
              </p>
            </div>

            <div className="border border-zinc-700 p-4 rounded bg-zinc-800">
              <h3 className="text-lg font-semibold mb-2">Players</h3>
              <ul className="space-y-2">
                {room.players.map((player) => (
                  <li key={player.id} className="flex items-center gap-2">
                    <span className="text-white">{player.name}</span>
                    {player.id === room.host.id && (
                      <span className="text-yellow-400 text-xs font-semibold">(host)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {room.host.id === playerId && (
            <button
                onClick={handleStartGame}
                disabled={room.players.length < 2}
                className={`py-2 px-4 rounded font-semibold ${
                room.players.length < 2
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-black"
                }`}
            >
                Start Game
            </button>
            )}

            <button
              onClick={handleLeaveRoom}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Leave Room
            </button>
          </div>
        ) : mode === "create" ? (
          // ------------------- CREATE ROOM -------------------
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 text-white rounded"
            />
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="px-4 py-2 text-white rounded"
            >
              {[2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  Max Players: {count}
                </option>
              ))}
            </select>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Make Room Private
            </label>
            {isPrivate && (
              <input
                type="password"
                placeholder="Room Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2 text-white rounded"
              />
            )}
            <button
              onClick={handleCreateRoom}
              className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-2 px-4 rounded"
            >
              Create Game
            </button>
            <button
              onClick={() => setMode("default")}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Cancel
            </button>
          </div>
        ) : mode === "join" ? (
          // ------------------- JOIN ROOM -------------------
        <div className="flex flex-col gap-6">
        {/* Your Name - Used for both Private and Public */}
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Your Name</label>
            <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 text-white rounded bg-zinc-800"
            />
            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
        </div>

        {/* Join Private Room */}
        <div className="flex flex-col gap-4 border border-zinc-700 p-4 rounded">
            <h2 className="text-lg font-semibold text-yellow-400">Join Private Room</h2>
            <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-2 text-white rounded bg-zinc-800"
            />
            <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 text-white rounded bg-zinc-800"
            />
            <button
            onClick={() => {
                handleJoinRoom(roomId, name, password, true);
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-2 px-4 rounded"
            >
            Join Private Room
            </button>
        </div>

        {/* Join Public Room */}
        <div className="border border-zinc-700 p-4 rounded">
            <h2 className="text-lg font-semibold text-green-400 mb-4">Public Rooms</h2>
            <div className="grid gap-3">
            {publicRooms.map((room) => (
                <div
                key={room.id}
                className="flex justify-between items-center bg-zinc-800 px-4 py-2 rounded"
                >
                <span className="text-lg text-white">{room.host.name}</span>
                <span className="text-lg text-white">{room.id}</span>
                <span className="text-sm text-gray-400">
                    {room.players.length}/{room.maxPlayers} players
                </span>
                <button
                    onClick={() => {
                    handleJoinRoom(room.id, name);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm px-3 py-1 rounded"
                >
                    Join
                </button>
                </div>
            ))}
            </div>
        </div>

        <button
            onClick={() => setMode("default")}
            className="text-sm text-gray-400 hover:text-white underline"
        >
            Back
        </button>
        </div>
        ) : (
          // ------------------- DEFAULT -------------------
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setMode("create")}
              className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-2 px-4 rounded"
            >
              Create Room
            </button>
            <button
              onClick={handlePublicRooms}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded"
            >
              Join Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerLobby;
