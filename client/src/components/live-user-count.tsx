import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export function LiveUserCount() {
  const [userCount, setUserCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Request current user count
      socket.send(JSON.stringify({ type: 'getUserCount' }));
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Update user count when receiving liveUserCount message
        if (data.type === 'liveUserCount') {
          setUserCount(data.count);
        }
        // Initial connection message also contains liveUserCount
        else if (data.type === 'connection' && typeof data.liveUserCount === 'number') {
          setUserCount(data.liveUserCount);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Connection closed
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);

  // If not connected, don't show anything
  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-background/95 border rounded-full shadow-sm">
      <Users size={16} className="text-primary" />
      <Badge variant="outline" className="font-medium text-xs">
        {userCount} {userCount === 1 ? 'user' : 'users'} online
      </Badge>
    </div>
  );
}