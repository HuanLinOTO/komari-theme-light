import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Activity, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

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

interface NodeTableProps {
  nodes: NodeData[];
  onViewCharts?: (nodeUuid: string, nodeName: string) => void;
}

export function NodeTable({ nodes, onViewCharts }: NodeTableProps) {
  // 使用 useMemo 优化格式化函数，避免重复创建
  const formatBytes = useMemo(() => (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatUptime = useMemo(() => (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  const formatRegion = useMemo(() => (region: string): string => {
    // 处理台湾地区 emoji 显示问题，在中国大陆显示为联合国旗帜
    if (region.includes('🇹🇼') || region.toLowerCase().includes('taiwan') || region.includes('台湾')) {
      return region.replace(/🇹🇼/g, '🇺🇳').replace(/taiwan/gi, 'Taiwan').replace(/台湾/g, 'Taiwan');
    }
    return region;
  }, []);

  // 获取资源使用率状态，用于动态颜色显示
  const getResourceStatus = useMemo(() => (usage: number, type: 'cpu' | 'ram' | 'disk') => {
    let threshold;
    switch (type) {
      case 'cpu':
        threshold = usage >= 80 ? 'critical' : usage >= 60 ? 'warning' : 'normal';
        break;
      case 'ram':
        threshold = usage >= 85 ? 'critical' : usage >= 70 ? 'warning' : 'normal';
        break;
      case 'disk':
        threshold = usage >= 90 ? 'critical' : usage >= 75 ? 'warning' : 'normal';
        break;
      default:
        threshold = 'normal';
    }
    return threshold;
  }, []);

  // 获取状态对应的颜色类
  const getStatusColor = useMemo(() => (status: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return '';
    }
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30 sticky top-0 z-10">
          <TableRow className="hover:bg-muted/50">
            <TableHead className="p-3 sm:p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">状态</TableHead>
            <TableHead className="p-3 sm:p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">名称</TableHead>
            <TableHead className="p-3 sm:p-4 hidden sm:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">位置</TableHead>
            <TableHead className="p-3 sm:p-4 hidden md:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">分组</TableHead>
            <TableHead className="p-3 sm:p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">CPU</TableHead>
            <TableHead className="p-3 sm:p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">内存</TableHead>
            <TableHead className="p-3 sm:p-4 hidden sm:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">磁盘</TableHead>
            <TableHead className="p-3 sm:p-4 hidden md:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">网络</TableHead>
            <TableHead className="p-3 sm:p-4 hidden lg:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">系统</TableHead>
            <TableHead className="p-3 sm:p-4 hidden sm:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">运行时间</TableHead>
            <TableHead className="p-3 sm:p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node, index) => {
            const isOnline = node.status === 'online';
            const stats = node.stats;
            
            // 计算资源使用率状态
            const cpuStatus = stats ? getResourceStatus(stats.cpu.usage, 'cpu') : 'normal';
            const ramStatus = stats ? getResourceStatus((stats.ram.used / stats.ram.total) * 100, 'ram') : 'normal';
            const diskStatus = stats ? getResourceStatus((stats.disk.used / stats.disk.total) * 100, 'disk') : 'normal';
            
            return (
              <TableRow
                key={node.uuid}
                className={`transition-all duration-200 hover:bg-muted/30 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'} ${isOnline ? '' : 'opacity-75'}`}
              >
                <TableCell className="p-3 sm:p-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`relative ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                      <Activity className="h-4 w-4" />
                      {isOnline && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={isOnline ? 'default' : 'secondary'}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {isOnline ? '在线' : '离线'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="p-3 sm:p-4">
                  <div className="font-medium text-sm">{node.name}</div>
                  <div className="text-xs text-muted-foreground sm:hidden">{formatRegion(node.region)}</div>
                </TableCell>
                <TableCell className="p-3 sm:p-4 text-muted-foreground hidden sm:table-cell">
                  <div className="text-sm">{formatRegion(node.region)}</div>
                </TableCell>
                <TableCell className="p-3 sm:p-4 text-muted-foreground hidden md:table-cell">
                  <div className="text-sm">{node.group}</div>
                </TableCell>
                <TableCell className="p-3 sm:p-4">
                  {stats ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cpuStatus === 'critical' ? 'bg-red-500' :
                              cpuStatus === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(stats.cpu.usage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent h-2 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(cpuStatus as 'normal' | 'warning' | 'critical')}`}>
                        {stats.cpu.usage.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-3 sm:p-4">
                  {stats ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              ramStatus === 'critical' ? 'bg-red-500' :
                              ramStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((stats.ram.used / stats.ram.total) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent h-2 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(ramStatus as 'normal' | 'warning' | 'critical')}`}>
                        {((stats.ram.used / stats.ram.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-3 sm:p-4 hidden sm:table-cell">
                  {stats ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              diskStatus === 'critical' ? 'bg-red-500' :
                              diskStatus === 'warning' ? 'bg-yellow-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min((stats.disk.used / stats.disk.total) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent h-2 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(diskStatus as 'normal' | 'warning' | 'critical')}`}>
                        {((stats.disk.used / stats.disk.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-3 sm:p-4 hidden md:table-cell">
                  {stats ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>↑{formatBytes(stats.network.up)}/s</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>↓{formatBytes(stats.network.down)}/s</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-3 sm:p-4 text-muted-foreground hidden lg:table-cell">
                  <div className="text-sm truncate max-w-[150px]" title={node.os}>
                    {node.os}
                  </div>
                </TableCell>
                <TableCell className="p-3 sm:p-4 hidden sm:table-cell">
                  {stats ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{formatUptime(stats.uptime)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-3 sm:p-4 text-right">
                  {onViewCharts && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCharts(node.uuid, node.name)}
                      className="h-8 w-8 p-0 rounded-full transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:scale-105"
                      title="查看历史数据"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}