import React, { useState } from 'react';
import { Card, Tabs, Select, Space, Alert } from 'antd';
import LogicModelGraph from '../components/visualization/LogicModelGraph';
import MermaidDiagram from '../components/visualization/MermaidDiagram';
import { DataDomain } from '../types/metadata';
import { MappingVisualNode } from '../types/mapping';

const { TabPane } = Tabs;
const { Option } = Select;

interface VisualizationPageProps {
  dataDomains: DataDomain[];
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({ dataDomains }) => {
  const [activeTab, setActiveTab] = useState('graph');
  const [selectedNode, setSelectedNode] = useState<MappingVisualNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setError(null);
  };

  const handleNodeClick = (node: MappingVisualNode) => {
    setSelectedNode(node);
  };

  return (
    <Card title="数据模型可视化">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="交互式图表" key="graph">
            <LogicModelGraph
              dataDomains={dataDomains}
              onNodeClick={handleNodeClick}
            />
          </TabPane>
          <TabPane tab="Mermaid图表" key="mermaid">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Select
                defaultValue="er"
                style={{ width: 200 }}
                onChange={() => {
                  setActiveTab('mermaid');
                  setError(null);
                }}
              >
                <Option value="er">实体关系图</Option>
                <Option value="flowchart">流程图</Option>
                <Option value="sequence">序列图</Option>
              </Select>
              <MermaidDiagram
                dataDomains={dataDomains}
                type={activeTab === 'mermaid' ? 'er' : undefined}
              />
            </Space>
          </TabPane>
        </Tabs>

        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
          />
        )}

        {selectedNode && (
          <Card title="节点详情" size="small">
            <div className="space-y-2">
              <div>
                <span className="font-medium">名称：</span>
                {selectedNode.data.label}
              </div>
              {selectedNode.data.description && (
                <div>
                  <span className="font-medium">描述：</span>
                  {selectedNode.data.description}
                </div>
              )}
              <div>
                <span className="font-medium">字段数量：</span>
                {selectedNode.data.fields?.length || 0}
              </div>
            </div>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default VisualizationPage; 