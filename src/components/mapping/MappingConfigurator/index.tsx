import React, { useState, useEffect } from 'react';
import { Card, Tabs, Select, Form, Input, Button, Table, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MappingConfig, Field } from '../../../types/logicModel';
import type { DataDomain } from '../../../types/metadata';

const { TabPane } = Tabs;
const { Option } = Select;

interface MappingConfiguratorProps {
  dataDomains: DataDomain[];
  onSave: (config: MappingConfig) => void;
}

const MappingConfigurator: React.FC<MappingConfiguratorProps> = ({ dataDomains, onSave }) => {
  const [form] = Form.useForm();
  const [sourceFields, setSourceFields] = useState<Field[]>([]);
  const [targetFields, setTargetFields] = useState<Field[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);

  const columns = [
    {
      title: '源字段',
      dataIndex: 'sourceField',
      key: 'sourceField',
      render: (_: any, record: any, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={record.sourceField}
          onChange={(value) => handleFieldChange(index, 'sourceField', value)}
        >
          {sourceFields.map(field => (
            <Option key={field.name} value={field.name}>{field.name} ({field.description})</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '目标字段',
      dataIndex: 'targetField',
      key: 'targetField',
      render: (_: any, record: any, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={record.targetField}
          onChange={(value) => handleFieldChange(index, 'targetField', value)}
        >
          {targetFields.map(field => (
            <Option key={field.name} value={field.name}>{field.name} ({field.description})</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '转换表达式',
      dataIndex: 'transformation',
      key: 'transformation',
      render: (_: any, record: any, index: number) => (
        <Input
          value={record.transformation}
          onChange={(e) => handleFieldChange(index, 'transformation', e.target.value)}
          placeholder="可选：输入转换表达式"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, _record: any, index: number) => (
        <Space>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteMapping(index)}
          />
        </Space>
      ),
    },
  ];

  const handleFieldChange = (index: number, key: string, value: any) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [key]: value };
    setMappings(newMappings);
  };

  const handleDeleteMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleAddMapping = () => {
    setMappings([...mappings, { sourceField: undefined, targetField: undefined }]);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const config: MappingConfig = {
        ...values,
        mappings: mappings.filter(m => m.sourceField && m.targetField),
      };
      onSave(config);
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  return (
    <Card title="映射配置">
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="配置名称"
          rules={[{ required: true, message: '请输入配置名称' }]}
        >
          <Input placeholder="请输入配置名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="配置描述"
        >
          <Input.TextArea placeholder="请输入配置描述" />
        </Form.Item>

        <Form.Item
          name="sourceType"
          label="源类型"
          rules={[{ required: true, message: '请选择源类型' }]}
        >
          <Select placeholder="请选择源类型">
            <Option value="ThirdPartyDto">第三方数据</Option>
            <Option value="LogicDto">逻辑模型</Option>
            <Option value="FHIR">FHIR资源</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="targetType"
          label="目标类型"
          rules={[{ required: true, message: '请选择目标类型' }]}
        >
          <Select placeholder="请选择目标类型">
            <Option value="ThirdPartyDto">第三方数据</Option>
            <Option value="LogicDto">逻辑模型</Option>
            <Option value="FHIR">FHIR资源</Option>
          </Select>
        </Form.Item>

        <Card title="字段映射" bordered={false}>
          <Button
            type="dashed"
            onClick={handleAddMapping}
            style={{ marginBottom: 16 }}
            icon={<PlusOutlined />}
          >
            添加映射
          </Button>
          <Table
            columns={columns}
            dataSource={mappings}
            rowKey={(record, index) => index?.toString() || '0'}
            pagination={false}
          />
        </Card>

        <Form.Item style={{ marginTop: 16 }}>
          <Button type="primary" onClick={handleSave}>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default MappingConfigurator; 