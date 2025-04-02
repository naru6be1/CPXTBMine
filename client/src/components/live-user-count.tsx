import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export function LiveUserCount() {
  const [userCount, setUserCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const baseCountRef = useRef<number>(0);
  // Using a clientId to ensure consistent count for the same user across devices
  const clientIdRef = useRef<string>(
    localStorage.getItem('cpxtb_client_id') || 
    `client_${Math.random().toString(36).substring(2, 12)}`
  );

  // Store client ID in localStorage for persistence across page refreshes
  useEffect(() => {
    if (!localStorage.getItem('cpxtb_client_id')) {
      localStorage.setItem('cpxtb_client_id', clientIdRef.current);
    }
  }, []);

  // Apply small fluctuations to keep the display lively but consistent
  useEffect(() => {
    if (userCount === 0) return;
    
    // Apply a small fluctuation based on client ID for consistency
    const fluctuationSeed = clientIdRef.current.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const fluctuation = ((fluctuationSeed % 5) - 2); // Range -2 to +2
    
    // Set display count with the small fluctuation for liveliness
    setDisplayCount(userCount + fluctuation);
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
      
      // Request current user count with client ID for tracking
      socket.send(JSON.stringify({ 
        type: 'getUserCount',
        clientId: clientIdRef.current 
      }));
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

    // Request updated count periodically (every 5 minutes to match server update frequency)
    const updateInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'getUserCount',
          clientId: clientIdRef.current 
        }));
      }
    }, 300000); // 5 minutes

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