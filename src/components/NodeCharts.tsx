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
  ResponsiveContainer
} from 'recharts';

interface NodeChartsProps {
  nodeUuid: string;
  nodeName: string;
}

interface LoadRecord {
  time: string;
  cpu: number;
  ram: number;
  ram_total: number;
  swap: number;
  swap_total: number;
  disk: number;
  disk_total: number;
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


// 优化后的颜色方案，使用更现代、更协调的配色
const colors = [
  "#3B82F6", // 蓝色 - CPU
  "#10B981", // 绿色 - 系统负载
  "#8B5CF6", // 紫色 - 内存
  "#F59E0B", // 橙色 - 磁盘
  "#EF4444", // 红色 - TCP连接
  "#06B6D4", // 青色 - UDP连接
  "#EC4899", // 粉色 - 入站流量
  "#84CC16", // 黄绿色 - 出站流量
  "#6366F1", // 靛蓝色 - SWAP
];

// 自定义 hook 检测屏幕尺寸
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export function NodeCharts({ nodeUuid, nodeName }: NodeChartsProps) {
  const [loadData, setLoadData] = useState<LoadRecord[] | null>(null);
  const [pingData, setPingData] = useState<PingRecord[] | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(24); // 默认24小时
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();

  // 图表边距和尺寸配置
  const chartMargin = useMemo(() => ({
    top: 10,
    right: isMobile ? 4 : 16,
    bottom: isMobile ? 20 : 10,
    left: isMobile ? 4 : 16
  }), [isMobile]);

  const yAxisConfig = useMemo(() => ({
    tick: { fontSize: isMobile ? 10 : 12, dx: -5 },
    width: isMobile ? 35 : 40
  }), [isMobile]);

  const xAxisConfig = useMemo(() => ({
    tick: { fontSize: isMobile ? 10 : 11 },
    height: isMobile ? 30 : 40,
    minTickGap: isMobile ? 50 : 30
  }), [isMobile]);

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
      cpu: Math.min(Math.max(record.cpu || 0, 0), 100), // 限制在0-100之间
      ram: Math.min(Math.max((record.ram / record.ram_total) * 100 || 0, 0), 100), // 内存使用率 = ram / ram_total * 100
      swap: Math.min(Math.max((record.swap / record.swap_total) * 100 || 0, 0), 100), // SWAP使用率 = swap / swap_total * 100
      disk: Math.min(Math.max((record.disk / record.disk_total) * 100 || 0, 0), 100), // 硬盘使用率 = disk / disk_total * 100
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

  const timeFormatter = useCallback((value: any, index: number) => {
    if (!chartData.length) return "";
    const totalTicks = chartData.length;

    if (isMobile) {
      // 移动端只显示首尾标签
      if (index === 0 || index === totalTicks - 1) {
        return new Date(value).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } else {
      // 桌面端显示首尾和中间标签
      if (index === 0 || index === totalTicks - 1 || index === Math.floor(totalTicks / 2)) {
        return new Date(value).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
    return "";
  }, [chartData.length, isMobile]);

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
    swap: {
      label: "SWAP使用率",
      color: colors[8],
    },
  } as const;

  // 磁盘使用率图表配置
  const diskChartConfig = {
    disk: {
      label: "磁盘使用率",
      color: colors[3],
    },
  } as const;

  // TCP和UDP连接数图表配置
  const connectionsChartConfig = {
    connections: {
      label: "TCP连接数",
      color: colors[4],
    },
    connections_udp: {
      label: "UDP连接数",
      color: colors[5],
    },
  } as const;

  // 网络流量图表配置
  const networkChartConfig = {
    network_in: {
      label: "入站流量",
      color: colors[6],
    },
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
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      {/* 时间范围选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base sm:text-lg">{nodeName}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">

        {/* CPU使用率 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Cpu className="h-5 w-5" />
              CPU使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cpuChartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden chart-mobile-optimized">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  accessibilityLayer
                  margin={chartMargin}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={timeFormatter}
                    interval="preserveStartEnd"
                    minTickGap={xAxisConfig.minTickGap}
                    tick={xAxisConfig.tick}
                    height={xAxisConfig.height}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                    allowDecimals={false}
                    orientation="left"
                    type="number"
                    tick={yAxisConfig.tick}
                    width={yAxisConfig.width}
                  />
                  <ChartTooltip
                    cursor={false}
                    formatter={(v: any) => `${typeof v === 'number' ? v.toFixed(2) : v}%`}
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
              </ResponsiveContainer>
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
            <ChartContainer config={loadChartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden chart-mobile-optimized">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  accessibilityLayer
                  margin={chartMargin}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={timeFormatter}
                    interval="preserveStartEnd"
                    minTickGap={xAxisConfig.minTickGap}
                    tick={xAxisConfig.tick}
                    height={xAxisConfig.height}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    orientation="left"
                    type="number"
                    tick={yAxisConfig.tick}
                    width={yAxisConfig.width}
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
              </ResponsiveContainer>
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
            <ChartContainer config={ramChartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden chart-mobile-optimized">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  accessibilityLayer
                  margin={chartMargin}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={timeFormatter}
                    interval="preserveStartEnd"
                    minTickGap={xAxisConfig.minTickGap}
                    tick={xAxisConfig.tick}
                    height={xAxisConfig.height}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                    allowDecimals={false}
                    orientation="left"
                    type="number"
                    tick={yAxisConfig.tick}
                    width={yAxisConfig.width}
                  />
                  <ChartTooltip
                    cursor={false}
                    formatter={(v: any) => `${typeof v === 'number' ? v.toFixed(2) : v}%`}
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
                  <Line
                    dataKey="swap"
                    name="SWAP使用率"
                    stroke={colors[8] || "#4CAF50"}
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={2}
                    connectNulls={false}
                    type="linear"
                  />
                  <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
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
            <ChartContainer config={diskChartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden chart-mobile-optimized">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  accessibilityLayer
                  margin={chartMargin}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={timeFormatter}
                    interval="preserveStartEnd"
                    minTickGap={xAxisConfig.minTickGap}
                    tick={xAxisConfig.tick}
                    height={xAxisConfig.height}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                    allowDecimals={false}
                    orientation="left"
                    type="number"
                    tick={yAxisConfig.tick}
                    width={yAxisConfig.width}
                  />
                  <ChartTooltip
                    cursor={false}
                    formatter={(v: any) => `${typeof v === 'number' ? v.toFixed(2) : v}%`}
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
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* TCP和UDP连接数 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Network className="h-5 w-5" />
              网络连接数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={connectionsChartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden chart-mobile-optimized">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  accessibilityLayer
                  margin={chartMargin}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={timeFormatter}
                    interval="preserveStartEnd"
                    minTickGap={xAxisConfig.minTickGap}
                    tick={xAxisConfig.tick}
                    height={xAxisConfig.height}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    orientation="left"
                    type="number"
                    tick={yAxisConfig.tick}
                    width={yAxisConfig.width}
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
                  <Line
                    dataKey="connections"
                    name="TCP连接数"
                    stroke={colors[4]}
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={2}
                    connectNulls={false}
                    type="linear"
                  />
                  <Line
                    dataKey="connections_udp"
                    name="UDP连接数"
                    stroke={colors[5]}
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={2}
                    connectNulls={false}
                    type="linear"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 网络流量 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Network className="h-5 w-5" />
              网络流量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={networkChartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden chart-mobile-optimized">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  accessibilityLayer
                  margin={chartMargin}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={timeFormatter}
                    interval="preserveStartEnd"
                    minTickGap={xAxisConfig.minTickGap}
                    tick={xAxisConfig.tick}
                    height={xAxisConfig.height}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    unit="KB/s"
                    orientation="left"
                    type="number"
                    tick={{ ...yAxisConfig.tick, dx: -5 }}
                    width={isMobile ? 50 : 60}
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
                    fillOpacity={0.3}
                    type="linear"
                  />
                  <Area
                    dataKey="network_out"
                    name="出站流量"
                    stroke={colors[7]}
                    fill={colors[7]}
                    fillOpacity={0.3}
                    type="linear"
                  />
                </AreaChart>
              </ResponsiveContainer>
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
              <ChartContainer config={pingChartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden chart-mobile-optimized">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={pingChartData}
                    accessibilityLayer
                    margin={chartMargin}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={timeFormatter}
                      interval="preserveStartEnd"
                      minTickGap={xAxisConfig.minTickGap}
                      tick={xAxisConfig.tick}
                      height={xAxisConfig.height}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      unit="ms"
                      allowDecimals={false}
                      orientation="left"
                      type="number"
                      tick={yAxisConfig.tick}
                      width={isMobile ? 45 : 50}
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
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}