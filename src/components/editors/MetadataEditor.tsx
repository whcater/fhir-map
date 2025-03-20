import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogicDto, ThirdPartyDto, LogicDtoField, ThirdPartyDtoField } from '../../types/metadata';
import { Form, Input, Select, Button, Space, Card, Tabs, Modal, Table } from 'antd';
import { DataDomain } from '../../types/metadata';
import MonacoEditor from '@monaco-editor/react';
import { parseJson, parseXml } from '../../utils/convertUtils';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

// 验证Schema
const fieldSchema = z.object({
  name: z.string().min(1, '字段名称不能为空'),
  type: z.string().min(1, '字段类型不能为空'),
  description: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.any().optional()
});

const thirdPartyFieldSchema = fieldSchema.extend({
  desc: z.string().min(1, '字段描述不能为空')
});

const fhirMappingSchema = z.object({
  path: z.string().min(1, 'FHIR路径不能为空'),
  type: z.string().min(1, '类型不能为空'),
  condition: z.string().optional(),
  transform: z.string().optional()
});

const thirdPartyMappingSchema = z.object({
  third_party_dto: z.string().min(1, '第三方DTO不能为空'),
  field_desc: z.string().min(1, '字段描述不能为空'),
  field_path: z.string().min(1, '字段路径不能为空'),
  transform: z.string().optional()
});

const logicDtoFieldSchema = fieldSchema.extend({
  fhir_mapping: fhirMappingSchema.optional(),
  third_party_mapping: thirdPartyMappingSchema.optional()
});

const logicDtoSchema = z.object({
  name: z.string().min(1, 'DTO名称不能为空'),
  id: z.string().min(1, 'DTO ID不能为空'),
  description: z.string().optional(),
  meta: z.object({
    fields: z.array(logicDtoFieldSchema)
  })
});

const thirdPartyDtoSchema = z.object({
  name: z.string().min(1, 'DTO名称不能为空'),
  id: z.string().optional(),
  description: z.string().optional(),
  meta: z.object({
    fields: z.array(thirdPartyFieldSchema)
  })
});

interface MetadataEditorProps {
  dataDomain?: DataDomain;
  onSave?: (dataDomain: DataDomain) => void;
}

const { Option } = Select;
const { TabPane } = Tabs;

interface FieldEditorModalProps {
  visible: boolean;
  field?: LogicDtoField | ThirdPartyDtoField;
  isLogicDto: boolean;
  onSave: (field: LogicDtoField | ThirdPartyDtoField) => void;
  onCancel: () => void;
}

const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  visible,
  field,
  isLogicDto,
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (field) {
      form.setFieldsValue(field);
    }
  }, [field, form]);

  const handleSubmit = (values: any) => {
    onSave(values);
    form.resetFields();
  };

  return (
    <Modal
      title={`${isLogicDto ? '逻辑模型' : '第三方模型'}字段编辑`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={field}
      >
        <Form.Item
          name="name"
          label="字段名称"
          rules={[{ required: true, message: '请输入字段名称' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="type"
          label="字段类型"
          rules={[{ required: true, message: '请选择字段类型' }]}
        >
          <Select>
            <Option value="string">字符串</Option>
            <Option value="number">数字</Option>
            <Option value="boolean">布尔值</Option>
            <Option value="object">对象</Option>
            <Option value="array">数组</Option>
            <Option value="date">日期</Option>
            <Option value="datetime">日期时间</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea />
        </Form.Item>

        {isLogicDto && (
          <>
            <Form.Item
              name={['fhir_mapping', 'path']}
              label="FHIR路径"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name={['fhir_mapping', 'type']}
              label="FHIR类型"
            >
              <Select>
                <Option value="string">字符串</Option>
                <Option value="number">数字</Option>
                <Option value="boolean">布尔值</Option>
                <Option value="date">日期</Option>
                <Option value="datetime">日期时间</Option>
                <Option value="reference">引用</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name={['fhir_mapping', 'transform']}
              label="转换表达式"
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name={['fhir_mapping', 'condition']}
              label="条件"
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name={['third_party_mapping', 'third_party_dto']}
              label="关联第三方DTO"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name={['third_party_mapping', 'field_desc']}
              label="第三方字段描述"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name={['third_party_mapping', 'field_path']}
              label="第三方字段路径"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name={['third_party_mapping', 'transform']}
              label="第三方转换表达式"
            >
              <Input.TextArea />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            <Button onClick={onCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const MetadataEditor: React.FC<MetadataEditorProps> = ({ dataDomain, onSave }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('logic');
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<LogicDtoField | ThirdPartyDtoField>();
  const [currentDtoIndex, setCurrentDtoIndex] = useState<number>(-1);
  const [isLogicDto, setIsLogicDto] = useState(true);
  const [jsonContent, setJsonContent] = useState('');
  const [xmlContent, setXmlContent] = useState('');

  const handleSubmit = (values: any) => {
    if (onSave) {
      onSave(values as DataDomain);
    }
  };

  const handleAddField = (dtoIndex: number, isLogic: boolean) => {
    setCurrentDtoIndex(dtoIndex);
    setIsLogicDto(isLogic);
    setCurrentField(undefined);
    setFieldModalVisible(true);
  };

  const handleEditField = (field: LogicDtoField | ThirdPartyDtoField, dtoIndex: number, isLogic: boolean) => {
    setCurrentDtoIndex(dtoIndex);
    setIsLogicDto(isLogic);
    setCurrentField(field);
    setFieldModalVisible(true);
  };

  const handleFieldSave = (field: LogicDtoField | ThirdPartyDtoField) => {
    const formValues = form.getFieldsValue();
    if (isLogicDto) {
      const logicDtos = formValues.logicalDtos || [];
      if (!logicDtos[currentDtoIndex]) {
        logicDtos[currentDtoIndex] = { meta: { fields: [] } };
      }
      if (!logicDtos[currentDtoIndex].meta) {
        logicDtos[currentDtoIndex].meta = { fields: [] };
      }
      if (!logicDtos[currentDtoIndex].meta.fields) {
        logicDtos[currentDtoIndex].meta.fields = [];
      }
      if (currentField) {
        const fieldIndex = logicDtos[currentDtoIndex].meta.fields.findIndex(
          (f: LogicDtoField) => f.name === currentField.name
        );
        if (fieldIndex > -1) {
          logicDtos[currentDtoIndex].meta.fields[fieldIndex] = field as LogicDtoField;
        } else {
          logicDtos[currentDtoIndex].meta.fields.push(field as LogicDtoField);
        }
      } else {
        logicDtos[currentDtoIndex].meta.fields.push(field as LogicDtoField);
      }
      form.setFieldsValue({ logicalDtos: logicDtos });
    } else {
      const thirdPartyDtos = formValues.thirdPartyDtos || [];
      if (!thirdPartyDtos[currentDtoIndex]) {
        thirdPartyDtos[currentDtoIndex] = { meta: { fields: [] } };
      }
      if (!thirdPartyDtos[currentDtoIndex].meta) {
        thirdPartyDtos[currentDtoIndex].meta = { fields: [] };
      }
      if (!thirdPartyDtos[currentDtoIndex].meta.fields) {
        thirdPartyDtos[currentDtoIndex].meta.fields = [];
      }
      if (currentField) {
        const fieldIndex = thirdPartyDtos[currentDtoIndex].meta.fields.findIndex(
          (f: ThirdPartyDtoField) => f.name === currentField.name
        );
        if (fieldIndex > -1) {
          thirdPartyDtos[currentDtoIndex].meta.fields[fieldIndex] = field as ThirdPartyDtoField;
        } else {
          thirdPartyDtos[currentDtoIndex].meta.fields.push(field as ThirdPartyDtoField);
        }
      } else {
        thirdPartyDtos[currentDtoIndex].meta.fields.push(field as ThirdPartyDtoField);
      }
      form.setFieldsValue({ thirdPartyDtos });
    }
    setFieldModalVisible(false);
  };

  const handleGenerateFromJson = async () => {
    try {
      const metadata = await parseJson(jsonContent);
      form.setFieldsValue(metadata);
    } catch (error) {
      Modal.error({
        title: 'JSON解析错误',
        content: String(error)
      });
    }
  };

  const handleGenerateFromXml = async () => {
    try {
      const metadata = await parseXml(xmlContent);
      form.setFieldsValue(metadata);
    } catch (error) {
      Modal.error({
        title: 'XML解析错误',
        content: String(error)
      });
    }
  };

  React.useEffect(() => {
    if (dataDomain) {
      form.setFieldsValue(dataDomain);
    }
  }, [dataDomain, form]);

  return (
    <Card title="元数据编辑器">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="手动编辑" key="manual">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={dataDomain}
          >
            {/* 数据域基本信息 */}
            <Form.Item
              name="name"
              label="数据域名称"
              rules={[{ required: true, message: '请输入数据域名称' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="id"
              label="数据域ID"
              rules={[{ required: true, message: '请输入数据域ID' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea />
            </Form.Item>

            {/* 逻辑模型列表 */}
            <Form.List name="logicalDtos">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Card
                      key={key}
                      title={`逻辑模型 #${index + 1}`}
                      extra={
                        <Space>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddField(index, true)}
                          >
                            添加字段
                          </Button>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            删除模型
                          </Button>
                        </Space>
                      }
                      style={{ marginBottom: 16 }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="逻辑模型名称"
                          rules={[{ required: true, message: '请输入逻辑模型名称' }]}
                        >
                          <Input />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'id']}
                          label="逻辑模型ID"
                          rules={[{ required: true, message: '请输入逻辑模型ID' }]}
                        >
                          <Input />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="描述"
                        >
                          <Input.TextArea />
                        </Form.Item>

                        {/* 字段列表 */}
                        <Form.Item
                          {...restField}
                          name={[name, 'meta', 'fields']}
                          label="字段列表"
                        >
                          <Table
                            columns={[
                              {
                                title: '字段名称',
                                dataIndex: 'name',
                                key: 'name'
                              },
                              {
                                title: '类型',
                                dataIndex: 'type',
                                key: 'type'
                              },
                              {
                                title: '描述',
                                dataIndex: 'description',
                                key: 'description'
                              },
                              {
                                title: '操作',
                                key: 'action',
                                render: (_, record: LogicDtoField) => (
                                  <Space>
                                    <Button
                                      type="link"
                                      onClick={() => handleEditField(record, index, true)}
                                    >
                                      编辑
                                    </Button>
                                    <Button
                                      type="link"
                                      danger
                                      onClick={() => {
                                        const fields = form.getFieldValue(['logicalDtos', name, 'meta', 'fields']) || [];
                                        const newFields = fields.filter((f: LogicDtoField) => f.name !== record.name);
                                        form.setFieldValue(['logicalDtos', name, 'meta', 'fields'], newFields);
                                      }}
                                    >
                                      删除
                                    </Button>
                                  </Space>
                                )
                              }
                            ]}
                            dataSource={form.getFieldValue(['logicalDtos', name, 'meta', 'fields']) || []}
                            rowKey="name"
                          />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}

                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加逻辑模型
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            {/* 第三方数据模型列表 */}
            <Form.List name="thirdPartyDtos">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Card
                      key={key}
                      title={`第三方模型 #${index + 1}`}
                      extra={
                        <Space>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddField(index, false)}
                          >
                            添加字段
                          </Button>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            删除模型
                          </Button>
                        </Space>
                      }
                      style={{ marginBottom: 16 }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="第三方模型名称"
                          rules={[{ required: true, message: '请输入第三方模型名称' }]}
                        >
                          <Input />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'id']}
                          label="第三方模型ID"
                        >
                          <Input />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="描述"
                        >
                          <Input.TextArea />
                        </Form.Item>

                        {/* 字段列表 */}
                        <Form.Item
                          {...restField}
                          name={[name, 'meta', 'fields']}
                          label="字段列表"
                        >
                          <Table
                            columns={[
                              {
                                title: '字段名称',
                                dataIndex: 'name',
                                key: 'name'
                              },
                              {
                                title: '显示名称',
                                dataIndex: 'desc',
                                key: 'desc'
                              },
                              {
                                title: '类型',
                                dataIndex: 'type',
                                key: 'type'
                              },
                              {
                                title: '描述',
                                dataIndex: 'description',
                                key: 'description'
                              },
                              {
                                title: '操作',
                                key: 'action',
                                render: (_, record: ThirdPartyDtoField) => (
                                  <Space>
                                    <Button
                                      type="link"
                                      onClick={() => handleEditField(record, index, false)}
                                    >
                                      编辑
                                    </Button>
                                    <Button
                                      type="link"
                                      danger
                                      onClick={() => {
                                        const fields = form.getFieldValue(['thirdPartyDtos', name, 'meta', 'fields']) || [];
                                        const newFields = fields.filter((f: ThirdPartyDtoField) => f.name !== record.name);
                                        form.setFieldValue(['thirdPartyDtos', name, 'meta', 'fields'], newFields);
                                      }}
                                    >
                                      删除
                                    </Button>
                                  </Space>
                                )
                              }
                            ]}
                            dataSource={form.getFieldValue(['thirdPartyDtos', name, 'meta', 'fields']) || []}
                            rowKey="name"
                          />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}

                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加第三方模型
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="从JSON生成" key="json">
          <Space direction="vertical" style={{ width: '100%' }}>
            <MonacoEditor
              height="400px"
              language="json"
              value={jsonContent}
              onChange={(value) => setJsonContent(value || '')}
              options={{
                minimap: { enabled: false }
              }}
            />
            <Button type="primary" onClick={handleGenerateFromJson}>
              生成元数据
            </Button>
          </Space>
        </TabPane>

        <TabPane tab="从XML生成" key="xml">
          <Space direction="vertical" style={{ width: '100%' }}>
            <MonacoEditor
              height="400px"
              language="xml"
              value={xmlContent}
              onChange={(value) => setXmlContent(value || '')}
              options={{
                minimap: { enabled: false }
              }}
            />
            <Button type="primary" onClick={handleGenerateFromXml}>
              生成元数据
            </Button>
          </Space>
        </TabPane>
      </Tabs>

      <FieldEditorModal
        visible={fieldModalVisible}
        field={currentField}
        isLogicDto={isLogicDto}
        onSave={handleFieldSave}
        onCancel={() => setFieldModalVisible(false)}
      />
    </Card>
  );
};

export default MetadataEditor; 