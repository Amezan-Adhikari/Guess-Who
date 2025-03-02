"use client";

import useSocket, { PlayerData, RoomData } from '../../lib/useSocket';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const { socket, isConnected, joinRoom } = useSocket();
  
  // Player details
  const [name, setName] = useState("");
  const [newName, setNewName] = useState("");
  const [avatar, setAvatar] = useState("");
  const avatars = ["/icons/avatar1.svg", "/icons/avatar2.svg", "/icons/avatar3.svg", "/icons/avatar4.svg", "/icons/avatar5.svg", "/icons/avatar6.svg"];
  
  // Room state
  const [roomCode, setRoomCode] = useState<string>("");
  const [inputRoomCode, setInputRoomCode] = useState<string>("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  
  // Initialize player data from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("username-guesswho") || "DragonSlayer";
    const savedAvatar = localStorage.getItem("avatar-guesswho") || "/icons/avatar1.svg";
    setName(savedName);
    setNewName(savedName);
    setAvatar(savedAvatar);
  }, []);
  
  // Initialize Socket.IO and register event handlers
  useEffect(() => {
    // Initialize Socket.IO server
    fetch('/api/socket').catch(err => console.error('Failed to initialize socket server:', err));
    
    if (!socket) return;
    
    // When the player successfully joins a room
    socket.on('playerJoined', (data: RoomData) => {
      console.log('Player joined:', data);
      
      // Check if this is the current player joining
      if (data.player.id === socket.id) {
        setRoomCode(data.room);
        setHasJoined(true);
      }
      
      // Update players list
      setPlayers(data.players);
    });
    
    // When a player leaves the room
    socket.on('playerLeft', (data) => {
      console.log('Player left:', data);
      setPlayers(data.players);
    });
    
    // When the game starts
    socket.on('gameStarted', (data) => {
      console.log('Game started:', data);
      // Redirect to the game page
      router.push(`/game/${data.room}`);
    });
    
    // Handle room errors
    socket.on('roomError', (data) => {
      setError(data.message);
    });
    
    // Cleanup event listeners
    return () => {
      if (socket) {
        socket.off('playerJoined');
        socket.off('playerLeft');
        socket.off('gameStarted');
        socket.off('roomError');
      }
    };
  }, [socket, isConnected, router]);
  
  // Handle joining a room
  const handleJoinRoom = () => {
    if (!inputRoomCode.trim()) {
      setError("Please enter a room code");
      return;
    }
    
    if (socket && isConnected && name && avatar) {
      setError(null);
      joinRoom(inputRoomCode.toUpperCase(), name, avatar);
    }
  };
  
  // Save player profile changes
  const saveChanges = () => {
    if (newName.trim()) {
      localStorage.setItem("username-guesswho", newName);
      setName(newName);
      
      // Update room with new player details if already joined a room
      if (socket && isConnected && roomCode && hasJoined) {
        // We can't directly update a player in a room
        // So we leave and rejoin with new details
        // This might be handled differently in your actual implementation
        joinRoom(roomCode, newName, avatar);
      }
    }
    
    localStorage.setItem("avatar-guesswho", avatar);
    setIsDialogOpen(false);
  };

  return (
    <>
      <main className="font-[victor] py-10 px-5">
        <div>
          <h1 className="bg-gradient-to-r from-[#F79060] to-[#8E10D7] text-center bg-clip-text text-transparent text-3xl tracking-wider">
            {hasJoined ? `Room: ${roomCode}` : "Join a Room"}
          </h1>
        </div>

        <div className="mx-auto mt-10 max-w-lg flex flex-col gap-4">
          {/* Show error message if any */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
              <button onClick={() => setError(null)} className="float-right">&times;</button>
            </div>
          )}
          
          {!hasJoined ? (
            <>
              <div className="flex items-center gap-5 mb-4">
                <img src={avatar} alt="avatar" className="w-12 h-12 rounded-full border" />
                <span>{name}</span>
                <button
                  type="button"
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <img src="/icons/pen.svg" alt="edit" className="w-5" />
                </button>
              </div>
            
              <div className="flex gap-2">
                <Input
                  placeholder="Enter room code"
                  value={inputRoomCode}
                  className="flex-1 border rounded-md px-3 py-2"
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
                <Button
                  type="button"
                  onClick={handleJoinRoom}
                  className="bg-[#F79060] hover:bg-[#8E10D7] text-white px-4 py-2 rounded-md transition duration-300 ease-in-out active:scale-90 active:opacity-90"
                >
                  Join Room
                </Button>
              </div>
              
              <div className="text-center mt-2">
                <a href="/" className="text-[#4d4d4d] hover:underline">
                  Back to Home
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h1 className="text-[#4d4d4d]">
                  Players {players.length} / 2
                </h1>
                <a href="/">
                  <button className="text-red-500 hover:text-red-600 cursor-pointer" type="button">
                    Leave Room
                  </button>
                </a>
              </div>
              
              {/* Player list */}
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-5">
                  <img 
                    src={player.avatar} 
                    alt="avatar" 
                    className="w-12 h-12 rounded-full border" 
                  />
                  <span>{player.userName}</span>
                  {player.id === socket?.id && (
                    <button
                      type="button"
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <img src="/icons/pen.svg" alt="edit" className="w-5" />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Waiting for host message */}
              <div className="mt-4 p-4 bg-gray-100 rounded-md text-center">
                <p className="text-sm text-gray-500">Waiting for the host to start the game...</p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal for Editing Name & Avatar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-[#FFFFFF] rounded-md md:p-10 p-5 font-[victor]">
          <DialogHeader>
            <DialogTitle className="text-[2c2c2c]">Update Details</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            {/* Name Input */}
            <Input
              placeholder="Enter your name"
              value={newName}
              className="w-full border rounded-md px-3 py-2"
              onChange={(e) => setNewName(e.target.value)}
            />

            {/* Avatar Selection */}
            <div className="flex items-center flex-wrap gap-4">
              {avatars.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Avatar ${index + 1}`}
                  className={`w-12 h-12 rounded-full border cursor-pointer ${
                    avatar === img ? "border-4 border-[#8E10D7]" : "border-gray-300"
                  }`}
                  onClick={() => setAvatar(img)}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              className="px-5 py-2 bg-[#8E10D7] text-white rounded-md hover:opacity-80"
              onClick={saveChanges}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}