import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Switch } from 'antd';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleDarkMode, isDarkMode }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '首页' },
    { path: '/metadata', label: '元数据设计' },
    { path: '/mapping', label: '映射配置' },
    { path: '/visual', label: '可视化模型' },
    { path: '/conversion', label: '数据转换' }
  ];
  
  return (
    <AntHeader style={{ padding: '0 16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      <Switch
        checked={isDarkMode}
        onChange={onToggleDarkMode}
        checkedChildren="🌙"
        unCheckedChildren="☀️"
      />
    </AntHeader>
  );
};

export default Header;