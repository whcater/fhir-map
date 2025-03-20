import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  DatabaseOutlined,
  ApiOutlined,
  LineChartOutlined,
  SwapOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页'
  },
  {
    key: '/metadata',
    icon: <DatabaseOutlined />,
    label: '元数据管理'
  },
  {
    key: '/mapping',
    icon: <ApiOutlined />,
    label: '映射配置'
  },
  {
    key: '/visualization',
    icon: <LineChartOutlined />,
    label: '可视化'
  },
  {
    key: '/conversion',
    icon: <SwapOutlined />,
    label: '数据转换'
  }
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sider theme="light" width={200}>
      <div style={{ height: '32px', margin: '16px', background: 'rgba(0, 0, 0, 0.2)' }} />
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};

export default Sidebar; 