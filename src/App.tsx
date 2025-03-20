import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';

// 初始化mermaid
import mermaid from 'mermaid';

const App: React.FC = () => {
  useEffect(() => {
    // 配置mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Noto Sans SC',
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          
          {/* 以下路由会在后续实现对应的组件 */}
          <Route path="metadata" element={<div className="min-h-[60vh] flex items-center justify-center">
            <div className="card text-center p-12">
              <h2 className="text-2xl font-bold mb-4">元数据管理</h2>
              <p className="text-gray-600 dark:text-gray-400">
                此功能正在开发中，敬请期待...
              </p>
            </div>
          </div>} />
          
          <Route path="mappings" element={<div className="min-h-[60vh] flex items-center justify-center">
            <div className="card text-center p-12">
              <h2 className="text-2xl font-bold mb-4">映射配置</h2>
              <p className="text-gray-600 dark:text-gray-400">
                此功能正在开发中，敬请期待...
              </p>
            </div>
          </div>} />
          
          <Route path="visualizer" element={<div className="min-h-[60vh] flex items-center justify-center">
            <div className="card text-center p-12">
              <h2 className="text-2xl font-bold mb-4">可视化</h2>
              <p className="text-gray-600 dark:text-gray-400">
                此功能正在开发中，敬请期待...
              </p>
            </div>
          </div>} />
          
          <Route path="conversion" element={<div className="min-h-[60vh] flex items-center justify-center">
            <div className="card text-center p-12">
              <h2 className="text-2xl font-bold mb-4">数据转换</h2>
              <p className="text-gray-600 dark:text-gray-400">
                此功能正在开发中，敬请期待...
              </p>
            </div>
          </div>} />
          
          {/* 404页面 */}
          <Route path="*" element={<div className="min-h-[60vh] flex items-center justify-center">
            <div className="card text-center p-12">
              <h2 className="text-3xl font-bold mb-4">404</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                抱歉，您访问的页面不存在。
              </p>
              <a href="/" className="btn btn-primary">
                返回首页
              </a>
            </div>
          </div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
