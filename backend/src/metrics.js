// Prometheus 指标采集模块
// 为每个 RESTful API 统计: 请求总数 (每分钟请求数/成功率) 与请求耗时 (P95 延时)
// Grafana 常用查询:
//   每分钟请求数: sum by (route) (increase(http_requests_total[1m]))
//   请求成功率:   sum(rate(http_requests_total{status_code=~"2.."}[5m])) / sum(rate(http_requests_total[5m]))
//   P95 延时:     histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))

const client = require('prom-client');

const register = new client.Registry();

// 请求总数计数器: 按 HTTP 方法 / 路由 / 状态码打标签
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'HTTP 请求总数',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 请求耗时直方图: 按 HTTP 方法 / 路由打标签, 用于计算 P95 分位延时
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP 请求耗时 (秒)',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

// 路由标签规范化: 静态资源 (含带 hash 的构建产物文件名) 统一归为 static, 避免标签基数膨胀
function normalizeRoute(pathname) {
  if (pathname === '/healthz') return '/healthz';
  if (pathname.startsWith('/api/')) return pathname;
  return 'static';
}

// 指标采集中间件: 响应结束时记录耗时与状态码
function metricsMiddleware(req, res, next) {
  // /metrics 自身不统计, 避免抓取请求污染指标
  if (req.path === '/metrics') {
    return next();
  }
  const route = normalizeRoute(req.path);
  const method = req.method;
  const endTimer = httpRequestDuration.startTimer({ method, route });
  res.on('finish', () => {
    endTimer();
    httpRequestsTotal.inc({ method, route, status_code: String(res.statusCode) });
  });
  next();
}

// /metrics 端点处理器: 输出 Prometheus 文本格式指标
async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

module.exports = { metricsMiddleware, metricsHandler };
