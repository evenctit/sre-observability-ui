// SRE 可观测性平台架构展示系统 - 后端服务
// 提供 /api/architecture 架构数据接口, 并托管前端构建产物

const path = require('path');
const fs = require('fs');
const express = require('express');
const architecture = require('./architecture');

const app = express();
const PORT = process.env.PORT || 3000;

// 健康检查接口 (与平台内服务约定保持一致)
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// 架构数据接口: 返回组件明细 / 数据链路 / 访问入口
app.get('/api/architecture', (req, res) => {
  res.json({
    meta: architecture.meta,
    components: architecture.components,
    connections: architecture.connections,
    access: architecture.access,
    externals: architecture.externals
  });
});

// 托管前端构建产物 (frontend/dist)
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // 非 API 路径统一回退到 index.html, 支持前端路由刷新
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/healthz') {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});
