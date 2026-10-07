// 主页面: 展示架构图、组件明细、数据链路与访问入口
import { useEffect, useState } from 'react';

export default function App() {
  // 架构数据由后端 /api/architecture 接口提供
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/architecture')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`接口返回 ${res.status}`);
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="error-page">加载架构数据失败: {error}</div>;
  }

  if (!data) {
    return <div className="loading-page">正在加载架构数据...</div>;
  }

  const { meta, components, connections, access } = data;

  return (
    <div className="page">
      <header className="header">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </header>

      <main className="main">
        {/* 架构图 */}
        <section className="card">
          <h2>系统架构图</h2>
          <div className="diagram">
            <img src={meta.diagram} alt="SRE 可观测性平台架构图" />
          </div>
        </section>

        {/* 组件明细 */}
        <section className="card">
          <h2>组件明细</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>组件</th>
                  <th>版本</th>
                  <th>命名空间</th>
                  <th>类型</th>
                  <th>端口</th>
                  <th>存储</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {components.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.name}</td>
                    <td className="mono">{c.version}</td>
                    <td>{c.namespace}</td>
                    <td>{c.type}</td>
                    <td className="mono">{c.ports}</td>
                    <td>{c.storage}</td>
                    <td className="desc">{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 数据链路 */}
        <section className="card">
          <h2>数据链路</h2>
          <ul className="flows">
            {connections.map((f, i) => (
              <li key={i}>
                <span className="mono">{f.from}</span>
                <span className="arrow">-&gt;</span>
                <span className="mono">{f.to}</span>
                <span className="flow-label">{f.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 访问入口 */}
        <section className="card">
          <h2>访问入口</h2>
          <div className="access-grid">
            {access.map((a) => (
              <div className="access-item" key={a.name}>
                <div className="access-name">{a.name}</div>
                <div className="access-url mono">{a.url}</div>
                <div className="access-desc">{a.description}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        架构数据来源: {meta.sourceRepo} 仓库 · 架构图: docs/architecture.svg
      </footer>
    </div>
  );
}
