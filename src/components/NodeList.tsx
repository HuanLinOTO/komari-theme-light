import { useState, useEffect, useMemo } from 'react';
import { NodeCard } from './NodeCard';
import { NodeTable } from './NodeTable';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Grid, List, RefreshCw, Tag, Wifi, WifiOff, Group } from 'lucide-react';

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
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
  
  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    nodes.forEach(node => {
      if (node.tags) {
        node.tags.split(/[,;]/).forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag) {
            tagSet.add(trimmedTag);
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [nodes]);
  
  // 多条件组合筛选
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      // 分组筛选
      if (groupFilter !== 'all' && node.group !== groupFilter) {
        return false;
      }
      
      // 标签筛选
      if (tagFilter !== 'all') {
        if (!node.tags) return false;
        const nodeTags = node.tags.split(/[,;]/).map(tag => tag.trim());
        if (!nodeTags.includes(tagFilter)) {
          return false;
        }
      }
      
      // 在线状态筛选
      if (statusFilter !== 'all' && node.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [nodes, groupFilter, tagFilter, statusFilter]);

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
      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold responsive-text-lg flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              服务器节点
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex bg-muted/50 p-1 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="text-xs h-8 px-3"
                >
                  <Grid className="h-4 w-4 mr-1" />
                  网格
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="text-xs h-8 px-3"
                >
                  <List className="h-4 w-4 mr-1" />
                  表格
                </Button>
              </div>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs h-8 px-3">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  刷新
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 筛选区域 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 分组筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Group className="h-4 w-4" />
                  分组
                </label>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择分组" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分组</SelectItem>
                    {groups.map(group => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 标签筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  标签
                </label>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择标签" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部标签</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 在线状态筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Wifi className="h-4 w-4" />
                  状态
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="online">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-3 w-3 text-green-500" />
                        在线
                      </div>
                    </SelectItem>
                    <SelectItem value="offline">
                      <div className="flex items-center gap-2">
                        <WifiOff className="h-3 w-3 text-red-500" />
                        离线
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* 当前筛选条件显示 */}
            <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground">当前筛选:</span>
              {groupFilter === 'all' && tagFilter === 'all' && statusFilter === 'all' ? (
                <span className="text-xs text-muted-foreground">无筛选条件</span>
              ) : (
                <>
                  {groupFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      分组: {groupFilter}
                    </Badge>
                  )}
                  {tagFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      标签: {tagFilter}
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      状态: {statusFilter === 'online' ? '在线' : '离线'}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 节点列表 */}
      {nodes.length === 0 ? (
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Grid className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">暂无服务器节点</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              请在管理后台添加服务器节点，然后刷新页面
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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