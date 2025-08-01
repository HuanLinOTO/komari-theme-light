import { useState, useEffect } from 'react';
import { NodeCard } from './NodeCard';
import { NodeTable } from './NodeTable';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Grid, List, RefreshCw } from 'lucide-react';

interface NodeData {
  uuid: string;
  name: string;
  cpu_name: string;
  virtualization: string;
  arch: string;
  cpu_cores: number;
  os: string;
  gpu_name: string;
  region: string;
  mem_total: number;
  swap_total: number;
  disk_total: number;
  weight: number;
  price: number;
  billing_cycle: number;
  currency: string;
  expired_at: string;
  group: string;
  tags: string;
  created_at: string;
  updated_at: string;
  status?: 'online' | 'offline';
  stats?: {
    cpu: { usage: number };
    ram: { total: number; used: number };
    swap: { total: number; used: number };
    disk: { total: number; used: number };
    network: { up: number; down: number; totalUp: number; totalDown: number };
    load: { load1: number; load5: number; load15: number };
    uptime: number;
    process: number;
    connections: { tcp: number; udp: number };
  };
}

interface NodeListProps {
  nodes?: NodeData[];
  loading?: boolean;
  onRefresh?: () => void;
  onViewCharts?: (nodeUuid: string, nodeName: string) => void;
}

export function NodeList({ nodes = [], loading = false, onRefresh, onViewCharts }: NodeListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  // 从 localStorage 读取视图模式
  useEffect(() => {
    const savedViewMode = localStorage.getItem('nodeViewMode') as 'grid' | 'table';
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // 保存视图模式到 localStorage
  useEffect(() => {
    localStorage.setItem('nodeViewMode', viewMode);
  }, [viewMode]);

  // 获取所有分组
  const groups = Array.from(new Set(nodes.map(node => node.group).filter(Boolean)));
  
  // 根据分组过滤节点
  const filteredNodes = groupFilter === 'all' 
    ? nodes 
    : nodes.filter(node => node.group === groupFilter);

  // 按权重排序（从小到大）
  const sortedNodes = [...filteredNodes].sort((a, b) => a.weight - b.weight);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">服务器节点</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="text-sm text-muted-foreground">分组:</span>
            <Button
              variant={groupFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGroupFilter('all')}
            >
              全部
            </Button>
            {groups.map(group => (
              <Button
                key={group}
                variant={groupFilter === group ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupFilter(group)}
              >
                {group}
              </Button>
            ))}
            <span className="text-sm text-muted-foreground">
              共 {filteredNodes.length} 个节点
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 节点列表 */}
      {nodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">暂无服务器节点</p>
            <p className="text-sm text-muted-foreground">
              请在管理后台添加服务器节点
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid-responsive">
              {sortedNodes.map(node => (
                <NodeCard
                  key={node.uuid}
                  node={node}
                  onViewCharts={onViewCharts}
                />
              ))}
            </div>
          ) : (
            <NodeTable
              nodes={sortedNodes}
              onViewCharts={onViewCharts}
            />
          )}
        </div>
      )}
    </div>
  );
}