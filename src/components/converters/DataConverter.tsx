import React, { useState } from 'react';
import { Form, Input, Select, Button, Card, Alert } from 'antd';
import { DataDomain } from '../../types/metadata';
import { parseJson, parseXml } from '../../utils/convertUtils';

const { TextArea } = Input;
const { Option } = Select;

interface DataConverterProps {
  dataDomains: DataDomain[];
  onConvert?: (data: any) => void;
}

const DataConverter: React.FC<DataConverterProps> = ({ dataDomains, onConvert }) => {
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    try {
      setError(null);

      const { sourceData, dataDomainId, format } = values;

      if (!sourceData) {
        throw new Error('请输入源数据');
      }

      if (!dataDomainId) {
        throw new Error('请选择数据域');
      }

      let parsedData: any;

      // 解析源数据
      if (format === 'json') {
        try {
          parsedData = JSON.parse(sourceData);
        } catch {
          throw new Error('源数据不是有效的JSON格式');
        }
      } else {
        parsedData = await parseXml(sourceData);
      }

      // 找到选中的数据域
      const selectedDomain = dataDomains.find(domain => domain.id === dataDomainId);

      if (!selectedDomain) {
        throw new Error('未找到选中的数据域');
      }

      // 调用转换回调
      if (onConvert) {
        onConvert({
          dataDomain: selectedDomain,
          format,
          content: parsedData
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换过程中发生错误');
    }
  };

  const handleReset = () => {
    form.resetFields();
    setError(null);
  };

  return (
    <Card title="数据转换">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="dataDomainId"
          label="数据域"
          rules={[{ required: true, message: '请选择数据域' }]}
        >
          <Select placeholder="请选择数据域">
            {dataDomains.map(domain => (
              <Option key={domain.id} value={domain.id}>
                {domain.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="format"
          label="数据格式"
          rules={[{ required: true, message: '请选择数据格式' }]}
          initialValue="json"
        >
          <Select>
            <Option value="json">JSON</Option>
            <Option value="xml">XML</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="sourceData"
          label="源数据"
          rules={[{ required: true, message: '请输入源数据' }]}
        >
          <TextArea rows={10} placeholder="请输入源数据" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            转换
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={handleReset}>
            重置
          </Button>
        </Form.Item>
      </Form>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
        />
      )}
    </Card>
  );
};

export default DataConverter; 