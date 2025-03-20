import React from 'react';
import { Card } from 'antd';
import MetadataEditor from '../components/editors/MetadataEditor';

const MetadataPage: React.FC = () => {
  return (
    <Card title="元数据管理">
      <MetadataEditor />
    </Card>
  );
};

export default MetadataPage; 