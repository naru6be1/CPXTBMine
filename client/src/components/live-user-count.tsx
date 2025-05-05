import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export function LiveUserCount() {
  const [userCount, setUserCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const baseCountRef = useRef<number>(0);

  // Display the count from server with minimal client-side changes
  useEffect(() => {
    if (userCount === 0) return;
    
    // Just set the display count to what the server sent
    setDisplayCount(userCount);
  }, [userCount]);

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
        console.log('WebSocket message received:', data);
        
        // Update user count when receiving userCount message
        if (data.type === 'userCount') {
          console.log('Received new user count:', data.count);
          setUserCount(data.count);
          // Reset base count when we get a new server update
          baseCountRef.current = data.count;
        }
        // For backward compatibility
        else if (data.type === 'liveUserCount') {
          setUserCount(data.count);
          baseCountRef.current = data.count;
        }
        // Initial connection message contains userCount
        else if (data.type === 'connected' && typeof data.userCount === 'number') {
          console.log('Connected with user count:', data.userCount);
          setUserCount(data.userCount);
          baseCountRef.current = data.userCount;
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

    // Request updated count periodically
    const updateInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'getUserCount' }));
      }
    }, 30000);

    // Clean up on unmount
    return () => {
      clearInterval(updateInterval);
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
        {displayCount} {displayCount === 1 ? 'user' : 'users'} online
      </Badge>
    </div>
  );
}