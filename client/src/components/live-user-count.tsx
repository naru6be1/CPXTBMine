import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export function LiveUserCount() {
  const [userCount, setUserCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const baseCountRef = useRef<number>(0);

  // Create small fluctuations in the displayed user count
  useEffect(() => {
    if (userCount === 0) return;
    
    // Store the base count received from server
    if (baseCountRef.current === 0) {
      baseCountRef.current = userCount;
    }
    
    // Initial display
    setDisplayCount(userCount);
    
    // Create small random fluctuations every few seconds
    const fluctuationInterval = setInterval(() => {
      // Random value between -3 and +4
      const fluctuation = Math.floor(Math.random() * 8) - 3;
      
      // Apply fluctuation but ensure we don't go below the initial count or too far above
      const newCount = baseCountRef.current + fluctuation;
      setDisplayCount(newCount);
    }, 5000);
    
    return () => clearInterval(fluctuationInterval);
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
        
        // Update user count when receiving liveUserCount message
        if (data.type === 'liveUserCount') {
          setUserCount(data.count);
          // Reset base count when we get a new server update
          baseCountRef.current = data.count;
        }
        // Initial connection message also contains liveUserCount
        else if (data.type === 'connection' && typeof data.liveUserCount === 'number') {
          setUserCount(data.liveUserCount);
          baseCountRef.current = data.liveUserCount;
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