import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from './ui/table';
import { Activity, Cpu, HardDrive, MemoryStick, Network, BarChart3, Tag, Timer, BadgeDollarSign } from 'lucide-react';

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

interface NodeCardProps {
  node: NodeData;
  onViewCharts?: (nodeUuid: string, nodeName: string) => void;
}

export function NodeCard({ node, onViewCharts }: NodeCardProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    return `${days}天`;
  };

  const isOnline = node.status === 'online';
  const stats = node.stats;

  // 解析标签，支持逗号和分号分隔
  const tagList = node.tags ?
    node.tags
      .split(/[,;]/)
      .map(tag => tag.trim())
      .filter(tag => tag !== '')
    : [];

  return (
    <Card className={`card-hover data-card ${isOnline ? 'data-card-success' : 'data-card-danger'} overflow-hidden`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className={`h-5 w-5 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
            <CardTitle className="text-lg sm:text-base">{node.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
              {isOnline ? '在线' : '离线'}
            </Badge>
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {node.group}
          </Badge>

          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tagList.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-5">
        {stats && (
          <>
            {/* CPU 使用率 */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                <span className="text-sm font-medium">{stats.cpu.usage.toFixed(1)}%</span>
              </div>
              <Progress value={stats.cpu.usage} className="h-2" />
            </div>

            {/* 内存使用率 */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">内存</span>
                </div>
                <span className="text-sm font-medium">
                  {((stats.ram.used / stats.ram.total) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(stats.ram.used / stats.ram.total) * 100} className="h-2" />
            </div>

            {/* 磁盘使用率 */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">磁盘</span>
                </div>
                <span className="text-sm font-medium">
                  {((stats.disk.used / stats.disk.total) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(stats.disk.used / stats.disk.total) * 100} className="h-2" />
            </div>
          </>
        )}

        {/* 网络总流量和运行时间表格 */}
        <Table>
          <TableBody>
            {stats && (
              <>
                <TableRow>
                  <TableCell className="text-muted-foreground flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    总入站流量
                  </TableCell>
                  <TableCell className="text-right">
                    {stats.network.totalUp ? formatBytes(stats.network.totalUp) : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    总出站流量
                  </TableCell>
                  <TableCell className="text-right">
                    {stats.network.totalDown ? formatBytes(stats.network.totalDown) : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground  flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    运行时间
                  </TableCell>
                  <TableCell className="text-right">{formatUptime(stats.uptime)}</TableCell>
                </TableRow>
              </>
            )}
            {(node.price > 0 || node.price === -1) && (
              <TableRow>
                <TableCell className="text-muted-foreground  flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4" />
                  价格
                </TableCell>
                <TableCell className="text-right">
                  {node.price === -1 ? '免费' : `${node.currency}${node.price}/${node.billing_cycle}天`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}