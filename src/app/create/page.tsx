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

export default function CreatePage() {
  const router = useRouter();
  const { socket, isConnected, createRoom, startGame } = useSocket();
  
  // Player details
  const [name, setName] = useState("");
  const [newName, setNewName] = useState("");
  const [avatar, setAvatar] = useState("");
  const avatars = ["/icons/avatar1.svg", "/icons/avatar2.svg","/icons/avatar3.svg","/icons/avatar4.svg","/icons/avatar5.svg","/icons/avatar6.svg"];
  
  // Room state
  const [roomCode, setRoomCode] = useState<string>("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    
    // When the player successfully creates a room
    socket.on('roomCreated', (data: RoomData) => {
      console.log('Room created:', data);
      setRoomCode(data.room);
      setPlayers(data.players);
    });
    
    // When a new player joins the room
    socket.on('playerJoined', (data: RoomData) => {
      console.log('Player joined:', data);
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
    
    // Create a room when the socket is connected
    if (isConnected && name && avatar && !roomCode) {
      createRoom(name, avatar);
    }
    
    // Cleanup event listeners
    return () => {
      if (socket) {
        socket.off('roomCreated');
        socket.off('playerJoined');
        socket.off('playerLeft');
        socket.off('gameStarted');
        socket.off('roomError');
      }
    };
  }, [socket, isConnected, name, avatar, roomCode, createRoom, router]);
  
  // Save player profile changes
  const saveChanges = () => {
    if (newName.trim()) {
      localStorage.setItem("username-guesswho", newName);
      setName(newName);
      
      // Update room with new player details if room exists
      if (socket && isConnected && roomCode) {
        createRoom(newName, avatar);
      }
    }
    
    localStorage.setItem("avatar-guesswho", avatar);
    setIsDialogOpen(false);
  };
  
  // Handle game start
  const handleStartGame = () => {
    if (players.length < 2) {
      setError("Need 2 players to start the game!");
      return;
    }
    
    if (roomCode) {
      startGame(roomCode);
    }
  };

  return (
    <>
      <main className="font-[victor] py-10 px-5">
        <div>
          <h1 className="bg-gradient-to-r from-[#F79060] to-[#8E10D7] text-center bg-clip-text text-transparent text-3xl tracking-wider">
            Room: {roomCode || "Creating..."}
          </h1>
        </div>

        <div>
          <div className="mx-auto mt-10 max-w-lg flex flex-col gap-4">
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
            
            {/* Show error message if any */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
                <button onClick={() => setError(null)} className="float-right">&times;</button>
              </div>
            )}
            
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
            
            {/* Room code display for sharing */}
            {roomCode && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md text-center">
                <p className="text-sm text-gray-500">Share this code with your friend:</p>
                <p className="text-2xl font-bold">{roomCode}</p>
              </div>
            )}
            
            {/* Start button */}
            <button
              type="button"
              onClick={handleStartGame}
              disabled={players.length < 2}
              className={`${
                players.length < 2 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-[#F79060] hover:bg-[#8E10D7]"
              } text-white px-4 py-2 rounded-md transition duration-300 ease-in-out active:scale-90 active:opacity-90`}
            >
              {players.length < 2 ? "Waiting for Player 2..." : "Start Game"}
            </button>
          </div>
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