import { useState, useEffect, useCallback } from 'react';
import { apiService, wsService } from '../services/api';
import type { NodeWithStatus } from '../services/api';

export function useNodes() {
  const [nodes, setNodes] = useState<NodeWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取节点列表
  const fetchNodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const nodeData = await apiService.getNodes();
      
      // 为每个节点添加状态信息
      const nodesWithStatus: NodeWithStatus[] = nodeData.map(node => ({
        ...node,
        status: 'offline' as const // 默认为离线，WebSocket 会更新在线状态
      }));
      
      setNodes(nodesWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取节点数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新节点数据
  const refreshNodes = useCallback(async () => {
    await fetchNodes();
  }, [fetchNodes]);

  // 初始化时获取节点数据
  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  // 设置 WebSocket 监听
  useEffect(() => {
    const handleWebSocketData = (data: any) => {
      if (data.online && data.data) {
        setNodes(prevNodes =>
          prevNodes.map(node => {
            const isOnline = data.online.includes(node.uuid);
            const stats = data.data[node.uuid];
            
            return {
              ...node,
              status: isOnline ? 'online' : 'offline',
              stats: stats ? {
                ...stats,
                // 确保数据格式正确
                cpu: { usage: stats.cpu?.usage || 0 },
                ram: {
                  total: stats.ram?.total || 0,
                  used: stats.ram?.used || 0
                },
                swap: {
                  total: stats.swap?.total || 0,
                  used: stats.swap?.used || 0
                },
                disk: {
                  total: stats.disk?.total || 0,
                  used: stats.disk?.used || 0
                },
                network: {
                  up: stats.network?.up || 0,
                  down: stats.network?.down || 0,
                  totalUp: stats.network?.totalUp || 0,
                  totalDown: stats.network?.totalDown || 0
                },
                load: {
                  load1: stats.load?.load1 || 0,
                  load5: stats.load?.load5 || 0,
                  load15: stats.load?.load15 || 0
                },
                uptime: stats.uptime || 0,
                process: stats.process || 0,
                connections: {
                  tcp: stats.connections?.tcp || 0,
                  udp: stats.connections?.udp || 0
                },
                message: stats.message || '',
                updated_at: stats.updated_at || new Date().toISOString()
              } : undefined
            };
          })
        );
      }
    };

    // 订阅 WebSocket 数据
    const unsubscribe = wsService.subscribe(handleWebSocketData);
    
    // 连接 WebSocket
    wsService.connect();

    // 设置定时器，每2秒请求一次数据
    const intervalId = setInterval(() => {
      if (wsService.getOnlineNodes().length > 0) {
        wsService.send('get');
      }
    }, 2000);

    // 清理函数
    return () => {
      clearInterval(intervalId);
      unsubscribe();
      // 不在这里断开 WebSocket，因为其他组件可能也需要使用
    };
  }, []);

  // 获取特定节点的详细信息
  const getNodeDetails = useCallback(async (uuid: string) => {
    try {
      const [recentStats, loadHistory, pingHistory] = await Promise.all([
        apiService.getNodeRecentStats(uuid),
        apiService.getLoadHistory(uuid, 24),
        apiService.getPingHistory(uuid, 24)
      ]);

      return {
        recentStats,
        loadHistory,
        pingHistory
      };
    } catch (err) {
      console.error('Failed to fetch node details:', err);
      return null;
    }
  }, []);

  // 按分组获取节点
  const getNodesByGroup = useCallback((group: string) => {
    return nodes.filter(node => node.group === group);
  }, [nodes]);

  // 获取所有分组
  const getGroups = useCallback(() => {
    return Array.from(new Set(nodes.map(node => node.group).filter(Boolean)));
  }, [nodes]);

  // 获取在线节点数量
  const getOnlineCount = useCallback(() => {
    return nodes.filter(node => node.status === 'online').length;
  }, [nodes]);

  // 获取离线节点数量
  const getOfflineCount = useCallback(() => {
    return nodes.filter(node => node.status === 'offline').length;
  }, [nodes]);

  return {
    nodes,
    loading,
    error,
    refreshNodes,
    getNodeDetails,
    getNodesByGroup,
    getGroups,
    getOnlineCount,
    getOfflineCount
  };
}