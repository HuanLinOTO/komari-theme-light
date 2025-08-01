# Komari Theme Light

一个基于 Tailwind CSS 和 shadcn/ui 设计系统的现代化 Komari 服务器监控主题。

## 特性

- 🎨 现代化的设计，基于 shadcn/ui 设计系统
- 📊 实时服务器状态监控
- 🔄 WebSocket 实时数据更新
- 📈 直观的进度条和状态指示器
- 🏷️ 服务器分组筛选功能
- 👁️ 网格和表格两种视图模式
- 💾 本地存储用户偏好设置
- ⚡ 轻量化设计，最小外部依赖

## 开发

### 安装依赖

```bash
cd komari-theme-light
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建完成后，`dist` 目录将包含可用于 Komari 的主题文件。

### 打包部署

```bash
zip -r komari-theme-light.zip komari-theme.json dist/ preview.png
```

将 `komari-tailwind-theme.zip` 上传至 Komari 后台即可。

## 浏览器支持

支持所有现代浏览器

## License

```
           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                   Version 2, December 2004
 
Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

Everyone is permitted to copy and distribute verbatim or modified
copies of this license document, and changing it is allowed as long
as the name is changed.
 
           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

 0. You just DO WHAT THE FUCK YOU WANT TO.
```
