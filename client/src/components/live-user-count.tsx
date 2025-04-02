import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export function LiveUserCount() {
  const [userCount, setUserCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [shouldConnect, setShouldConnect] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const baseCountRef = useRef<number>(0);
  const updateIntervalRef = useRef<number | null>(null);

  // Display the count from server with minimal client-side changes
  useEffect(() => {
    if (userCount === 0) return;
    
    // Just set the display count to what the server sent
    setDisplayCount(userCount);
  }, [userCount]);

  // Defer WebSocket connection until after page load
  useEffect(() => {
    // Start with a default number until connection is established
    setDisplayCount(Math.floor(Math.random() * 40) + 100);
    
    // Defer socket connection until after important content loaded
    const timer = setTimeout(() => {
      setShouldConnect(true);
    }, 2000); // 2 second delay to prioritize critical content loading
    
    return () => clearTimeout(timer);
  }, []);

  // Separate the WebSocket connection into its own effect that only runs after delay
  useEffect(() => {
    if (!shouldConnect) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectSocket = () => {
      // Close existing socket if it exists
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {
          console.error('Error closing existing socket:', e);
        }
      }
      
      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
  
        // Connection opened
        socket.addEventListener('open', () => {
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
            // Silent fail - don't log errors for non-critical features
          }
        });
  
        // Connection closed - attempt reconnect with backoff
        socket.addEventListener('close', () => {
          setIsConnected(false);
          
          // Don't log close events to console - not critical
          // Only attempt reconnect if the component is still mounted
          setTimeout(connectSocket, 5000); // 5 second backoff on reconnect
        });
      } catch (error) {
        // Silent fail - don't show errors for non-critical features
        setTimeout(connectSocket, 5000); // 5 second backoff on reconnect
      }
    };
    
    // Initial connection
    connectSocket();

    // Request updated count less frequently (60s instead of 30s)
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    updateIntervalRef.current = window.setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'getUserCount' }));
      }
    }, 60000); // Every 60s to reduce server load

    // Clean up on unmount
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      
      if (socketRef.current) {
        try {
          socketRef.current.close();
          socketRef.current = null;
        } catch (e) {
          // Silent fail
        }
      }
    };
  }, [shouldConnect]);

  // Always show a count (default or real) - improves perceived performance by avoiding layout shift
  return (
    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-background/95 border rounded-full shadow-sm">
      <Users size={16} className="text-primary" />
      <Badge variant="outline" className="font-medium text-xs">
        {displayCount} {displayCount === 1 ? 'user' : 'users'} online
      </Badge>
    </div>
  );
}