'use client';
import { useState, useEffect } from 'react';
import useSocket, { ChatMessage } from '../../lib/useSocket';

export default function Home() {
  const { socket, isConnected, sendMessage } = useSocket();
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  useEffect(() => {
    // Init the Socket.IO server
    fetch('/api/socket')
      .catch(err => console.error('Failed to initialize socket server:', err));
    
    if (!socket) return;
    
    // Listen for incoming messages
    socket.on('message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    
    return () => {
      if (socket) {
        socket.off('message');
      }
    };
  }, [socket]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      sendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Socket.IO Example</h1>
      <div className="mb-4">
        Connection Status: <span className={isConnected ? "text-green-500" : "text-red-500"}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={message}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Type a message"
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded"
          disabled={!isConnected}
        >
          Send
        </button>
      </form>
      
      <div className="border p-4 h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2 p-2 rounded" style={{
            backgroundColor: msg.sender === 'user' ? '#e6f7ff' : '#f0f0f0',
            textAlign: msg.sender === 'user' ? 'right' : 'left'
          }}>
            <div className="text-sm text-gray-500">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}