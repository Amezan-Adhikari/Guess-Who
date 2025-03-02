'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Player data interface
export interface PlayerData {
  id: string;
  userName: string;
  avatar: string;
}

// Room data interface
export interface RoomData {
  room: string;
  player: PlayerData;
  players: PlayerData[];
}

// Define complete event types for type safety
export interface ServerToClientEvents {
  message: (data: ChatMessage) => void;
  roomCreated: (data: RoomData) => void;
  playerJoined: (data: RoomData) => void;
  gameStarted: (data: { room: string }) => void;
  playerLeft: (data: { room: string, playerId: string, players: PlayerData[] }) => void;
  roomError: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  message: (data: ChatMessage) => void;
  createRoom: (data: PlayerData) => void;
  joinRoom: (data: { room: string } & PlayerData) => void;
  startGame: (data: { room: string }) => void;
}

export interface ChatMessage {
  text: string;
  sender: string;
  timestamp: number;
  room?: string;
}

export default function useSocket() {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  useEffect(() => {
    // Initialize Socket.IO and store the instance
    // Use a function to avoid creating multiple socket instances
    let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
    
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://guesswhomultiplayer.netlify.app";
      socketInstance = io(socketUrl, {
        // Add these options to fix issues
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to Socket.IO server with ID:', socketInstance?.id);
      });
      
      socketInstance.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setIsConnected(false);
      });
      
      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from Socket.IO server');
      });
      
      setSocket(socketInstance);
    } catch (error) {
      console.error('Failed to connect to Socket.IO server:', error);
    }
    
    // Clean up the socket connection when the component unmounts
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);
  
  // Send a message to a specific room
  const sendMessage = (message: string, room?: string) => {
    if (socket && isConnected) {
      const chatMessage: ChatMessage = {
        text: message,
        sender: 'user',
        timestamp: Date.now(),
        room
      };
      socket.emit('message', chatMessage);
      return true;
    }
    return false;
  };
  
  // Create a new game room
  const createRoom = (userName: string, avatar: string) => {
    if (socket && isConnected) {
      socket.emit('createRoom', {
        id: socket.id || '',
        userName,
        avatar
      });
    }
  };
  
  // Join an existing room
  const joinRoom = (roomCode: string, userName: string, avatar: string) => {
    if (socket && isConnected) {
      socket.emit('joinRoom', {
        room: roomCode,
        id: socket.id || '',
        userName,
        avatar
      });
    }
  };
  
  // Start the game
  const startGame = (roomCode: string) => {
    if (socket && isConnected) {
      socket.emit('startGame', { room: roomCode });
    }
  };
  
  return { 
    socket, 
    isConnected, 
    sendMessage,
    createRoom,
    joinRoom,
    startGame
  };
}