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
import { Activity, Cpu, HardDrive, MemoryStick, Network, BarChart3 } from 'lucide-react';

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
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 sm:p-4">状态</TableHead>
            <TableHead className="p-2 sm:p-4">名称</TableHead>
            <TableHead className="p-2 sm:p-4 hidden sm:table-cell">位置</TableHead>
            <TableHead className="p-2 sm:p-4 hidden md:table-cell">分组</TableHead>
            <TableHead className="p-2 sm:p-4">CPU</TableHead>
            <TableHead className="p-2 sm:p-4">内存</TableHead>
            <TableHead className="p-2 sm:p-4 hidden sm:table-cell">磁盘</TableHead>
            <TableHead className="p-2 sm:p-4 hidden md:table-cell">网络</TableHead>
            <TableHead className="p-2 sm:p-4 hidden lg:table-cell">系统</TableHead>
            <TableHead className="p-2 sm:p-4 hidden sm:table-cell">运行时间</TableHead>
            <TableHead className="p-2 sm:p-4">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => {
            const isOnline = node.status === 'online';
            const stats = node.stats;
            
            return (
              <TableRow key={node.uuid}>
                <TableCell className="p-2 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
                    <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
                      {isOnline ? '在线' : '离线'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="p-2 sm:p-4 font-medium">{node.name}</TableCell>
                <TableCell className="p-2 sm:p-4 text-muted-foreground hidden sm:table-cell">{node.region}</TableCell>
                <TableCell className="p-2 sm:p-4 text-muted-foreground hidden md:table-cell">{node.group}</TableCell>
                <TableCell className="p-2 sm:p-4">
                  {stats ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{stats.cpu.usage.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  {stats ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <MemoryStick className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {((stats.ram.used / stats.ram.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-2 sm:p-4 hidden sm:table-cell">
                  {stats ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <HardDrive className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">
                        {((stats.disk.used / stats.disk.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-2 sm:p-4 hidden md:table-cell">
                  {stats ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Network className="h-4 w-4 text-purple-500" />
                      <span className="text-xs">
                        ↑{formatBytes(stats.network.up)}/s ↓{formatBytes(stats.network.down)}/s
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-muted-foreground hidden lg:table-cell">{node.os}</TableCell>
                <TableCell className="p-2 sm:p-4 hidden sm:table-cell">
                  {stats ? (
                    <span className="text-sm">{formatUptime(stats.uptime)}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  {onViewCharts && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCharts(node.uuid, node.name)}
                      className="h-8 w-8 p-0"
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