import { ThemeSwitcher } from './components/ThemeSwitcher'
import { NodeList } from './components/NodeList'
import { NodeCharts } from './components/NodeCharts'
import { WebSocketStatus } from './components/WebSocketStatus'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { useNodes } from './hooks/useNodes'
import { Activity, Server, AlertCircle, ArrowLeft, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiService } from './services/api'
import './App.css'

function App() {
  const [selectedNode, setSelectedNode] = useState<{ uuid: string; name: string } | null>(null);
  const [siteName, setSiteName] = useState<string>('Komari Monitor');
  
  const {
    nodes,
    loading,
    error,
    refreshNodes,
    getOnlineCount,
    getOfflineCount,
    getGroups
  } = useNodes();

  // 获取站点名称
  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const publicSettings = await apiService.getPublicSettings();
        if (publicSettings && publicSettings.sitename) {
          setSiteName(publicSettings.sitename);
        }
      } catch (error) {
        console.error('Failed to fetch site name:', error);
      }
    };

    fetchSiteName();
  }, []);

  const onlineCount = getOnlineCount();
  const offlineCount = getOfflineCount();
  const groups = getGroups();

  const handleViewCharts = (nodeUuid: string, nodeName: string) => {
    setSelectedNode({ uuid: nodeUuid, name: nodeName });
  };

  const handleBackToList = () => {
    setSelectedNode(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth p-3">
      <header className="border-b border-border sticky top-0 z-10 bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto py-3 sm:py-4 flex justify-between items-center mobile-stack">
          <div>
            <h1 className="responsive-text-xl sm:responsive-text-2xl font-bold">{siteName}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 mobile-full-width mobile-center">
            <WebSocketStatus />
            <ThemeSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/admin'}
              className="btn-animate text-xs sm:text-sm"
            >
              <Settings className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">管理后台</span>
              <span className="sm:hidden">后台</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-4 sm:py-6 md:py-8">
        {selectedNode ? (
          /* 节点图表视图 */
          <div>
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 mobile-stack">
              <Button variant="outline" onClick={handleBackToList} className="btn-animate text-xs sm:text-sm">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                返回节点列表
              </Button>
            </div>
            <NodeCharts
              nodeUuid={selectedNode.uuid}
              nodeName={selectedNode.name}
            />
          </div>
        ) : (
          /* 节点列表视图 */
          <>
            {/* 统计概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="data-card card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="responsive-text-sm font-medium">服务器总数</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="responsive-text-2xl font-bold">{nodes.length}</div>
                  <p className="responsive-text-xs text-muted-foreground">
                    {groups.length} 个分组
                  </p>
                </CardContent>
              </Card>

              <Card className="data-card data-card-success card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="responsive-text-sm font-medium">在线服务器</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="responsive-text-2xl font-bold text-green-600">{onlineCount}</div>
                  <p className="responsive-text-xs text-muted-foreground">
                    {nodes.length > 0 ? ((onlineCount / nodes.length) * 100).toFixed(1) : 0}% 可用率
                  </p>
                </CardContent>
              </Card>

              <Card className="data-card data-card-danger card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="responsive-text-sm font-medium">离线服务器</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="responsive-text-2xl font-bold text-red-600">{offlineCount}</div>
                  <p className="responsive-text-xs text-muted-foreground">
                    需要关注
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 错误提示 */}
            {error && (
              <Card className="mb-4 sm:mb-6 border-red-200 bg-red-50">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <p className="responsive-text-xs sm:responsive-text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 节点列表 */}
            <NodeList
              nodes={nodes}
              loading={loading}
              onRefresh={refreshNodes}
              onViewCharts={handleViewCharts}
            />
          </>
        )}
      </main>

      <footer className="border-t border-border mt-8 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center text-muted-foreground responsive-text-xs">
          Powered by Komari Monitor.
        </div>
      </footer>
    </div>
  )
}

export default App
