// 架构数据定义
// 数据来源: sre-observability-demo 仓库的 README 架构描述
// 用于向前端提供组件明细、数据链路与访问入口信息

// 系统元信息
const meta = {
  title: 'SRE 可观测性平台',
  subtitle: 'Kubernetes v1.37.1 · Infrastructure as Code',
  sourceRepo: 'sre-observability-demo',
  diagram: '/architecture.svg'
};

// 组件明细列表
// namespace: 组件所在命名空间 (宿主机 表示集群外)
const components = [
  {
    id: 'grafana',
    name: 'Grafana',
    version: '12.2.0',
    namespace: 'monitoring',
    type: '可视化与告警',
    ports: '3000 (NodePort 30300)',
    storage: 'PVC 10Gi',
    description: '统一可视化入口, 预置 Prometheus/Tempo/Loki/Pyroscope/PostgreSQL 五个数据源与 4 个 Dashboard, 内置 probe_success 告警规则并通过 SMTP 发送邮件'
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    version: 'v3.5.0',
    namespace: 'monitoring',
    type: '指标监控',
    ports: '9090',
    storage: 'PVC 10Gi (保留 15 天)',
    description: '抓取 cAdvisor 容器指标与 Pod 指标, 经 Blackbox Exporter 采集 probe_success 等黑盒探测指标'
  },
  {
    id: 'tempo',
    name: 'Tempo',
    version: '2.9.0',
    namespace: 'monitoring',
    type: '链路追踪',
    ports: '3200 (查询) / 4317 / 4318 (OTLP)',
    storage: 'emptyDir',
    description: '接收 demo-api 上报的 OTLP traces, 提供 TraceQL 查询'
  },
  {
    id: 'loki',
    name: 'Loki',
    version: '3.4.2',
    namespace: 'monitoring',
    type: '日志存储',
    ports: '3100',
    storage: 'PVC 10Gi',
    description: 'TSDB 索引 + filesystem 存储, 开启 OTLP 原生摄入 (/otlp/v1/logs), 承接全集群容器日志并提供 LogQL 查询'
  },
  {
    id: 'pyroscope',
    name: 'Pyroscope',
    version: '1.13.4',
    namespace: 'monitoring',
    type: '持续 Profiling',
    ports: '4040',
    storage: 'PVC 10Gi',
    description: '接收 demo-api SDK 每 10 秒推送的 CPU profile, 提供火焰图与函数级开销查询'
  },
  {
    id: 'parca',
    name: 'Parca',
    version: 'v0.22.0',
    namespace: 'monitoring',
    type: '持续 Profiling',
    ports: '7070',
    storage: 'PVC 10Gi',
    description: 'eBPF 持续 profiling 服务端 (parca-agent 因内核 6.17+ 兼容问题已停用, 数据链路由 Pyroscope 承担)'
  },
  {
    id: 'otel-collector',
    name: 'OpenTelemetry Collector',
    version: '0.127.0 (contrib)',
    namespace: 'monitoring',
    type: '日志采集',
    ports: '13133 (健康检查)',
    storage: '无',
    description: 'DaemonSet 方式部署, filelog receiver 采集节点 /var/log/pods 全集群容器日志, 解析 CRI 头并提取 K8s 元数据后经 OTLP/HTTP 发送至 Loki'
  },
  {
    id: 'blackbox-exporter',
    name: 'Blackbox Exporter',
    version: 'v0.27.0',
    namespace: 'monitoring',
    type: '黑盒探测',
    ports: '9115',
    storage: '无',
    description: '内置 http_2xx 模块, 供 Prometheus 调用 /probe 接口对 demo-api 与 tushare-service 的 /healthz 进行 HTTP 探测'
  },
  {
    id: 'demo-api',
    name: 'demo-api',
    version: 'v3',
    namespace: 'demo',
    type: '演示应用',
    ports: '5000 (NodePort 30080)',
    storage: '无',
    description: 'Flask + OpenTelemetry 埋点的 Python 应用, /api/process 内部调用 method_a + method_b, 输出 JSON 结构化日志并推送 CPU profile'
  },
  {
    id: 'tushare-service',
    name: 'tushare-service',
    version: '-',
    namespace: 'demo',
    type: '业务服务',
    ports: '-',
    storage: '无',
    description: 'RESTful 服务, 提供 /healthz 健康检查端点, 被 Blackbox 黑盒探测覆盖'
  },
  {
    id: 'tushare-batch',
    name: 'tushare batch job',
    version: '-',
    namespace: 'demo',
    type: '定时任务',
    ports: '-',
    storage: '无',
    description: '通过 tushare SDK 拉取 A 股日线行情并写入宿主机 PostgreSQL 的 tushare.daily 表'
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    version: '-',
    namespace: '宿主机',
    type: '数据库',
    ports: '5432',
    storage: '宿主机本地',
    description: '存放 tushare.daily 日线行情数据, Grafana 以 PostgreSQL 数据源 (uid=postgres) 直连查询'
  },
  {
    id: 'local-path-provisioner',
    name: 'local-path-provisioner',
    version: 'v0.0.31',
    namespace: 'monitoring',
    type: '存储供应',
    ports: '-',
    storage: '节点 /var/local-path-provisioner',
    description: '提供默认 StorageClass local-path, 为全部组件 PVC 动态供应本地存储'
  }
];

// 数据链路 (与架构图中箭头一致)
// from/to 取值为组件 id 或特殊标识 browser(用户浏览器)
const connections = [
  { from: 'browser', to: 'grafana', label: 'NodePort 30300 访问 Dashboard' },
  { from: 'grafana', to: 'prometheus', label: 'PromQL 指标查询' },
  { from: 'grafana', to: 'tempo', label: 'TraceQL 链路查询' },
  { from: 'grafana', to: 'loki', label: 'LogQL 日志查询' },
  { from: 'grafana', to: 'pyroscope', label: 'Profile 火焰图查询' },
  { from: 'grafana', to: 'postgresql', label: 'SQL 查询 :5432 (跨网络)' },
  { from: 'grafana', to: 'mail', label: 'probe_success < 1 持续 1m 触发 SMTP 邮件' },
  { from: 'demo-api', to: 'tempo', label: 'OTLP traces 上报 (4318)' },
  { from: 'demo-api', to: 'pyroscope', label: 'CPU profile 推送 (每 10s)' },
  { from: 'demo-api', to: 'otel-collector', label: '容器日志落盘 /var/log/pods' },
  { from: 'otel-collector', to: 'loki', label: 'OTLP/HTTP 日志摄入 (3100/otlp)' },
  { from: 'prometheus', to: 'blackbox-exporter', label: 'GET /probe 发起探测' },
  { from: 'blackbox-exporter', to: 'demo-api', label: 'HTTP 探测 /healthz' },
  { from: 'blackbox-exporter', to: 'tushare-service', label: 'HTTP 探测 /healthz' },
  { from: 'tushare-batch', to: 'postgresql', label: '写入 A 股日线数据' }
];

// 访问入口
const access = [
  {
    name: 'Grafana',
    url: 'http://<节点IP>:30300',
    description: '账号 admin / admin, Dashboard 位于 SRE Demo 文件夹'
  },
  {
    name: 'demo-api',
    url: 'http://<节点IP>:30080',
    description: 'RESTful API (/api/process, /healthz)'
  }
];

// 邮件告警目标 (非 K8s 组件, 供链路渲染使用)
const externals = [
  { id: 'browser', name: '用户浏览器' },
  { id: 'mail', name: '邮件通知 (yschen0925@sina.com)' }
];

module.exports = { meta, components, connections, access, externals };
