import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';

// Define types for the global namespace
declare global {
  var io: SocketIOServer | undefined;
}

export const dynamic = 'force-dynamic';

// Define all event interfaces
interface PlayerData {
  id: string;
  userName: string;
  avatar: string;
}

interface RoomData {
  room: string;
  player: PlayerData;
  players: PlayerData[];
}

interface ChatMessage {
  text: string;
  sender: string;
  timestamp: number;
  room?: string;
}

export async function GET() {
  if (global.io) {
    return NextResponse.json({ message: "Socket is already running" }, { status: 200 });
  }

  try {
    const io = new SocketIOServer({
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      // Add these options to fix WebSocket issues
      transports: ['polling', 'websocket'],
      addTrailingSlash: false,
      maxHttpBufferSize: 1e8,
    });
    
    // Store room players mapping
    const roomPlayers = new Map<string, PlayerData[]>();
    
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      let currentRoom = '';
      
      // Handle messages (scoped to rooms)
      socket.on('message', (data: ChatMessage) => {
        console.log('Message received:', data);
        if (data.room) {
          // Send only to the specific room
          io.to(data.room).emit('message', data);
        } else {
          // Fallback to global broadcast
          io.emit('message', data);
        }
      });
      
      // Create room handler
      socket.on('createRoom', (data: PlayerData) => {
        console.log('Creating room for:', data.userName);
        
        // Generate room code and join the room
        const roomCode = generateRoomCode();
        socket.join(roomCode);
        currentRoom = roomCode;
        
        // Initialize the room in our tracking map
        const player = { id: socket.id, userName: data.userName, avatar: data.avatar };
        roomPlayers.set(roomCode, [player]);
        
        // Emit room creation success
        const roomData: RoomData = {
          room: roomCode,
          player: player,
          players: roomPlayers.get(roomCode) || []
        };
        
        console.log('Room created:', roomCode, roomData);
        io.to(roomCode).emit('roomCreated', roomData);
      });
      
      // Join room handler
      socket.on('joinRoom', (data: { room: string } & PlayerData) => {
        const { room, userName, avatar } = data;
        console.log(`${userName} joining room:`, room);
        
        // Check if room exists
        if (!io.sockets.adapter.rooms.has(room)) {
          socket.emit('roomError', { message: 'Room does not exist' });
          return;
        }
        
        // Check if room is full (max 2 players for Guess Who)
        const players = roomPlayers.get(room) || [];
        if (players.length >= 2) {
          socket.emit('roomError', { message: 'Room is full' });
          return;
        }
        
        // Join the room
        socket.join(room);
        currentRoom = room;
        
        // Add player to room
        const player = { id: socket.id, userName, avatar };
        players.push(player);
        roomPlayers.set(room, players);
        
        // Notify everyone in the room about the new player
        const roomData: RoomData = {
          room,
          player,
          players: roomPlayers.get(room) || []
        };
        
        io.to(room).emit('playerJoined', roomData);
      });
      
      // Handle game start
      socket.on('startGame', (data: { room: string }) => {
        const { room } = data;
        console.log('Starting game in room:', room);
        io.to(room).emit('gameStarted', { room });
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove player from their current room
        if (currentRoom) {
          let players = roomPlayers.get(currentRoom) || [];
          players = players.filter(p => p.id !== socket.id);
          
          if (players.length === 0) {
            // If room is empty, remove it
            roomPlayers.delete(currentRoom);
          } else {
            // Update players list
            roomPlayers.set(currentRoom, players);
            
            // Notify remaining players
            io.to(currentRoom).emit('playerLeft', {
              room: currentRoom,
              playerId: socket.id,
              players: players
            });
          }
        }
      });
    });
    
    // Store io instance globally to prevent multiple instances
    global.io = io;
    
    // Start the Socket.IO server
    io.listen(3001);
    
    return NextResponse.json({ message: "Socket server started" }, { status: 200 });
  } catch (error:any) {
    console.error("Socket.IO initialization error:", error);
    return NextResponse.json({ message: "Socket server failed to start", error: error.message }, { status: 500 });
  }
}

function generateRoomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
}