import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { wsService } from '../services/api';

export function WebSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const ws = (wsService as any).ws;
      if (ws) {
        setIsConnected(ws.readyState === WebSocket.OPEN);
        setIsConnecting(ws.readyState === WebSocket.CONNECTING);
      }
    };

    // 初始检查
    checkConnection();

    // 定期检查连接状态
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReconnect = () => {
    setIsConnecting(true);
    wsService.disconnect();
    wsService.connect();
  };

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
        <Badge variant="secondary" className="text-xs">
          连接中...
        </Badge>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Wifi className="h-4 w-4 text-green-500" />
        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
          实时连接
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <WifiOff className="h-4 w-4 text-red-500" />
      <Badge variant="destructive" className="text-xs cursor-pointer" onClick={handleReconnect}>
        离线 (点击重连)
      </Badge>
    </div>
  );
}