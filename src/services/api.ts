// API 服务 - 用于与 Komari 后端通信

export interface NodeData {
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
}

export interface NodeStats {
  cpu: { usage: number };
  ram: { total: number; used: number };
  swap: { total: number; used: number };
  disk: { total: number; used: number };
  network: { up: number; down: number; totalUp: number; totalDown: number };
  load: { load1: number; load5: number; load15: number };
  uptime: number;
  process: number;
  connections: { tcp: number; udp: number };
  message: string;
  updated_at: string;
}

export interface NodeWithStatus extends NodeData {
  status: 'online' | 'offline';
  stats?: NodeStats;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // 使用相对路径，这样在部署时会自动适配
    this.baseUrl = '';
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null as any
      };
    }
  }

  // 获取所有节点信息
  async getNodes(): Promise<NodeData[]> {
    const response = await this.get<NodeData[]>('/api/nodes');
    return response.status === 'success' ? response.data : [];
  }

  // 获取指定节点的最近状态
  async getNodeRecentStats(uuid: string): Promise<NodeStats[]> {
    const response = await this.get<NodeStats[]>(`/api/recent/${uuid}`);
    return response.status === 'success' ? response.data : [];
  }

  // 获取负载历史记录
  async getLoadHistory(uuid: string, hours: number = 24): Promise<any> {
    const response = await this.get<any>(`/api/records/load?uuid=${uuid}&hours=${hours}`);
    return response.status === 'success' ? response.data : null;
  }

  // 获取 Ping 历史记录
  async getPingHistory(uuid: string, hours: number = 24): Promise<any> {
    const response = await this.get<any>(`/api/records/ping?uuid=${uuid}&hours=${hours}`);
    return response.status === 'success' ? response.data : null;
  }

  // 获取公开设置
  async getPublicSettings(): Promise<any> {
    const response = await this.get<any>('/api/public');
    return response.status === 'success' ? response.data : null;
  }

  // 获取版本信息
  async getVersion(): Promise<{ version: string; hash: string }> {
    const response = await this.get<{ version: string; hash: string }>('/api/version');
    return response.status === 'success' ? response.data : { version: 'unknown', hash: 'unknown' };
  }

  // 获取用户信息
  async getUserInfo(): Promise<any> {
    const response = await this.get<any>('/api/me');
    return response.status === 'success' ? response.data : null;
  }
}

// 创建 API 服务实例
export const apiService = new ApiService();

// WebSocket 连接管理
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private listeners: Set<(data: any) => void> = new Set();
  private onlineNodes: Set<string> = new Set();
  private nodeData: Map<string, any> = new Map();
  private url: string;

  constructor(url: string = '') {
    this.url = url;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/clients`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        // 发送获取数据请求
        this.send('get');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'success' && data.data) {
            // 更新在线节点列表
            this.onlineNodes = new Set(data.data.online || []);
            // 更新节点数据
            this.nodeData = new Map(Object.entries(data.data.data || {}));
            // 通知所有监听器
            this.listeners.forEach(listener => listener({
              online: Array.from(this.onlineNodes),
              data: Object.fromEntries(this.nodeData)
            }));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  subscribe(listener: (data: any) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getOnlineNodes(): string[] {
    return Array.from(this.onlineNodes);
  }

  getNodeData(uuid: string): any {
    return this.nodeData.get(uuid);
  }
}

// 创建 WebSocket 服务实例
export const wsService = new WebSocketService();