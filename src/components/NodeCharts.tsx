import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Activity, Cpu, Network, MemoryStick } from 'lucide-react';
import { apiService } from '../services/api';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from './ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';

interface NodeChartsProps {
  nodeUuid: string;
  nodeName: string;
}

interface LoadRecord {
  time: string;
  cpu: number;
  ram: number;
  disk: number;
  load: number;
  connections: number;
  connections_udp: number;
  net_in: number;
  net_out: number;
}

interface PingRecord {
  client: string;
  task_id: number;
  time: string;
  value: number;
}

interface TaskInfo {
  id: number;
  name: string;
  interval: number;
}


const colors = [
  "#F38181",
  "#347433",
  "#898AC4",
  "#03A6A1",
  "#7AD6F0",
  "#B388FF",
  "#FF8A65",
  "#FFD600",
];

export function NodeCharts({ nodeUuid, nodeName }: NodeChartsProps) {
  const [loadData, setLoadData] = useState<LoadRecord[] | null>(null);
  const [pingData, setPingData] = useState<PingRecord[] | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(24); // 默认24小时
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!nodeUuid) return;

    setLoading(true);
    setError(null);
    
    Promise.all([
      apiService.getLoadHistory(nodeUuid, timeRange),
      apiService.getPingHistory(nodeUuid, timeRange)
    ])
      .then(([loadHistory, pingHistory]) => {
        // 处理负载数据
        if (loadHistory && loadHistory.records) {
          const records = loadHistory.records || [];
          records.sort(
            (a: LoadRecord, b: LoadRecord) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          setLoadData(records);
        }

        // 处理 ping 数据
        if (pingHistory && pingHistory.records) {
          const records = pingHistory.records || [];
          records.sort(
            (a: PingRecord, b: PingRecord) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          setPingData(records);
          setTasks(pingHistory.tasks || []);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error");
        setLoading(false);
      });
  }, [nodeUuid, timeRange]);

  const chartData = useMemo(() => {
    const data = loadData || [];
    if (!data.length) return [];
    
    return data.map((record) => ({
      time: new Date(record.time).toISOString(),
      cpu: record.cpu,
      ram: record.ram,
      disk: record.disk,
      load: record.load,
      connections: record.connections,
      connections_udp: record.connections_udp,
      network_in: record.net_in / 1024, // 转换为 KB/s
      network_out: record.net_out / 1024 // 转换为 KB/s
    }));
  }, [loadData]);

  const pingChartData = useMemo(() => {
    const data = pingData || [];
    if (!data.length) return [];
    
    const grouped: Record<string, any> = {};
    const timeKeys: number[] = [];
    
    for (const rec of data) {
      const t = new Date(rec.time).getTime();
      let foundKey = null;
      for (const key of timeKeys) {
        if (Math.abs(key - t) <= 1500) {
          foundKey = key;
          break;
        }
      }
      const useKey = foundKey !== null ? foundKey : t;
      if (!grouped[useKey]) {
        grouped[useKey] = { time: new Date(useKey).toISOString() };
        if (foundKey === null) timeKeys.push(useKey);
      }
      grouped[useKey][rec.task_id] = rec.value;
    }
    
    return Object.values(grouped).sort(
      (a: any, b: any) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [pingData]);

  const timeFormatter = (value: any, index: number) => {
    if (!chartData.length) return "";
    if (index === 0 || index === chartData.length - 1) {
      return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "";
  };

  const labelFormatter = (value: any) => {
    const date = new Date(value);
    return date.toLocaleString([], {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // CPU使用率图表配置
  const cpuChartConfig = {
    cpu: {
      label: "CPU使用率",
      color: colors[0],
    },
  } as const;

  // 系统负载图表配置
  const loadChartConfig = {
    load: {
      label: "系统负载",
      color: colors[1],
    },
  } as const;

  // 内存使用率图表配置
  const ramChartConfig = {
    ram: {
      label: "内存使用率",
      color: colors[2],
    },
  } as const;

  // 磁盘使用率图表配置
  const diskChartConfig = {
    disk: {
      label: "磁盘使用率",
      color: colors[3],
    },
  } as const;

  // TCP连接数图表配置
  const tcpChartConfig = {
    connections: {
      label: "TCP连接数",
      color: colors[4],
    },
  } as const;

  // UDP连接数图表配置
  const udpChartConfig = {
    connections_udp: {
      label: "UDP连接数",
      color: colors[5],
    },
  } as const;

  // 网络入站流量图表配置
  const networkInChartConfig = {
    network_in: {
      label: "入站流量",
      color: colors[6],
    },
  } as const;

  // 网络出站流量图表配置
  const networkOutChartConfig = {
    network_out: {
      label: "出站流量",
      color: colors[7],
    },
  } as const;

  // Ping延迟图表配置
  const pingChartConfig = useMemo(() => {
    const config: Record<string, any> = {};
    tasks.forEach((task, idx) => {
      config[task.id] = {
        label: task.name,
        color: colors[idx % colors.length],
      };
    });
    return config;
  }, [tasks]);

  const handleLegendClick = useCallback((e: any) => {
    const key = e.dataKey;
    setHiddenLines((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleRefresh = useCallback(() => {
    if (!nodeUuid) return;
    
    setLoading(true);
    setError(null);
    
    Promise.all([
      apiService.getLoadHistory(nodeUuid, timeRange),
      apiService.getPingHistory(nodeUuid, timeRange)
    ])
      .then(([loadHistory, pingHistory]) => {
        // 处理负载数据
        if (loadHistory && loadHistory.records) {
          const records = loadHistory.records || [];
          records.sort(
            (a: LoadRecord, b: LoadRecord) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          setLoadData(records);
        }

        // 处理 ping 数据
        if (pingHistory && pingHistory.records) {
          const records = pingHistory.records || [];
          records.sort(
            (a: PingRecord, b: PingRecord) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          setPingData(records);
          setTasks(pingHistory.tasks || []);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error");
        setLoading(false);
      });
  }, [nodeUuid, timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-red-500 text-center">
            <p>{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 时间范围选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base sm:text-lg">{nodeName} - 历史数据</span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <Button
                variant={timeRange === 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(1)}
                className="text-xs sm:text-sm"
              >
                1小时
              </Button>
              <Button
                variant={timeRange === 6 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(6)}
                className="text-xs sm:text-sm"
              >
                6小时
              </Button>
              <Button
                variant={timeRange === 24 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(24)}
                className="text-xs sm:text-sm"
              >
                24小时
              </Button>
              <Button
                variant={timeRange === 168 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(168)}
                className="text-xs sm:text-sm"
              >
                7天
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs sm:text-sm">
                刷新
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* CPU使用率 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Cpu className="h-5 w-5" />
              CPU使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cpuChartConfig} className="h-[250px] sm:h-[300px]">
              <LineChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={timeFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  allowDecimals={false}
                  orientation="left"
                  type="number"
                  tick={{ dx: -10 }}
                  mirror={true}
                />
                <ChartTooltip
                  cursor={false}
                  formatter={(v: any) => `${v}%`}
                  content={
                    <ChartTooltipContent
                      labelFormatter={labelFormatter}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend />
                <Line
                  dataKey="cpu"
                  name="CPU使用率"
                  stroke={colors[0]}
                  dot={false}
                  isAnimationActive={false}
                  strokeWidth={2}
                  connectNulls={false}
                  type="linear"
                />
                <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 系统负载 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-5 w-5" />
              系统负载
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={loadChartConfig} className="h-[250px] sm:h-[300px]">
              <LineChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={timeFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  orientation="left"
                  type="number"
                  tick={{ dx: -10 }}
                  mirror={true}
                />
                <ChartTooltip
                  cursor={false}
                  formatter={(v: any) => typeof v === 'number' ? v.toFixed(2) : v}
                  content={
                    <ChartTooltipContent
                      labelFormatter={labelFormatter}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend />
                <Line
                  dataKey="load"
                  name="系统负载"
                  stroke={colors[1]}
                  dot={false}
                  isAnimationActive={false}
                  strokeWidth={2}
                  connectNulls={false}
                  type="linear"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 内存使用率 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MemoryStick className="h-5 w-5" />
              内存使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ramChartConfig} className="h-[250px] sm:h-[300px]">
              <LineChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={timeFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  allowDecimals={false}
                  orientation="left"
                  type="number"
                  tick={{ dx: -10 }}
                  mirror={true}
                />
                <ChartTooltip
                  cursor={false}
                  formatter={(v: any) => `${v}%`}
                  content={
                    <ChartTooltipContent
                      labelFormatter={labelFormatter}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend />
                <Line
                  dataKey="ram"
                  name="内存使用率"
                  stroke={colors[2]}
                  dot={false}
                  isAnimationActive={false}
                  strokeWidth={2}
                  connectNulls={false}
                  type="linear"
                />
                <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 磁盘使用率 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-5 w-5" />
              磁盘使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={diskChartConfig} className="h-[250px] sm:h-[300px]">
              <LineChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={timeFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  allowDecimals={false}
                  orientation="left"
                  type="number"
                  tick={{ dx: -10 }}
                  mirror={true}
                />
                <ChartTooltip
                  cursor={false}
                  formatter={(v: any) => `${v}%`}
                  content={
                    <ChartTooltipContent
                      labelFormatter={labelFormatter}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend />
                <Line
                  dataKey="disk"
                  name="磁盘使用率"
                  stroke={colors[3]}
                  dot={false}
                  isAnimationActive={false}
                  strokeWidth={2}
                  connectNulls={false}
                  type="linear"
                />
                <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* TCP连接数 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-5 w-5" />
              TCP连接数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={tcpChartConfig} className="h-[250px] sm:h-[300px]">
              <BarChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={timeFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  orientation="left"
                  type="number"
                  tick={{ dx: -10 }}
                  mirror={true}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={labelFormatter}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend />
                <Bar
                  dataKey="connections"
                  name="TCP连接数"
                  fill={colors[4]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* UDP连接数 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-5 w-5" />
              UDP连接数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={udpChartConfig} className="h-[250px] sm:h-[300px]">
              <BarChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={timeFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  orientation="left"
                  type="number"
                  tick={{ dx: -10 }}
                  mirror={true}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={labelFormatter}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend />
                <Bar
                  dataKey="connections_udp"
                  name="UDP连接数"
                  fill={colors[5]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 网络入站流量 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Network className="h-5 w-5" />
              网络入站流量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={networkInChartConfig} className="h-[250px] sm:h-[300px]">
              <AreaChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={timeFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  unit="KB/s"
                  orientation="left"
                  type="number"
                  tick={{ dx: -10 }}
                  mirror={true}
                />
                <ChartTooltip
                  cursor={false}
                  formatter={(v: any) => `${typeof v === 'number' ? v.toFixed(1) : v} KB/s`}
                  content={
                    <ChartTooltipContent
                      labelFormatter={labelFormatter}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend />
                <Area
                  dataKey="network_in"
                  name="入站流量"
                  stroke={colors[6]}
                  fill={colors[6]}
                  fillOpacity={0.6}
                  type="linear"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 网络出站流量 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Network className="h-5 w-5" />
              网络出站流量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={networkOutChartConfig} className="h-[250px] sm:h-[300px]">
              <AreaChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={timeFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  unit="KB/s"
                  orientation="left"
                  type="number"
                  tick={{ dx: -10 }}
                  mirror={true}
                />
                <ChartTooltip
                  cursor={false}
                  formatter={(v: any) => `${typeof v === 'number' ? v.toFixed(1) : v} KB/s`}
                  content={
                    <ChartTooltipContent
                      labelFormatter={labelFormatter}
                      indicator="dot"
                    />
                  }
                />
                <ChartLegend />
                <Area
                  dataKey="network_out"
                  name="出站流量"
                  stroke={colors[7]}
                  fill={colors[7]}
                  fillOpacity={0.6}
                  type="linear"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Ping 延迟 */}
        {pingChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="h-5 w-5" />
                Ping 延迟
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pingChartConfig} className="h-[250px] sm:h-[300px]">
                <LineChart
                  data={pingChartData}
                  accessibilityLayer
                  margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={timeFormatter}
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    unit="ms"
                    allowDecimals={false}
                    orientation="left"
                    type="number"
                    tick={{ dx: -10 }}
                    mirror={true}
                  />
                  <ChartTooltip
                    cursor={false}
                    formatter={(v: any) => `${v} ms`}
                    content={
                      <ChartTooltipContent
                        labelFormatter={labelFormatter}
                        indicator="dot"
                      />
                    }
                  />
                  <ChartLegend onClick={handleLegendClick} />
                  {tasks.map((task, idx) => (
                    <Line
                      key={task.id}
                      dataKey={String(task.id)}
                      name={task.name}
                      stroke={colors[idx % colors.length]}
                      dot={false}
                      isAnimationActive={false}
                      strokeWidth={2}
                      connectNulls={false}
                      type="linear"
                      hide={!!hiddenLines[task.id]}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}