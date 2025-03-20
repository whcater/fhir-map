import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Layout } from 'antd';
import Sidebar from './Sidebar';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 检查用户的系统偏好
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // 检查localStorage中的保存值
    const savedMode = localStorage.getItem('darkMode');
    
    if (savedMode !== null) {
      setIsDarkMode(JSON.parse(savedMode));
    } else {
      setIsDarkMode(prefersDarkMode);
    }
  }, []);

  useEffect(() => {
    // 保存到localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // 设置或移除类名
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // 在这里添加切换暗色模式的逻辑
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Header onToggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 