import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faFilter,
  faSave,
  faUpload,
  faIndent,
  faList,
  faFileCode,
  faFileImport
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../layouts/MainLayout';
import { useAppStore } from '../store';
import { ThirdPartyModel, DataDomain, FieldType, FieldMetadata } from '../types';
import { generateId, generateFieldsFromJson, generateFieldsFromXml } from '../utils';
import { showError, showSuccess } from '../utils/notification';

// 字段项组件
const FieldItem = ({ 
  field, 
  level = 0, 
  updateField, 
  removeField, 
  addField, 
  addObjectField, 
  addArrayField, 
  getChildFields 
}: { 
  field: FieldMetadata, 
  level?: number, 
  updateField: (id: string, updates: Partial<FieldMetadata>) => void, 
  removeField: (id: string) => void, 
  addField: (parentId?: string) => void, 
  addObjectField: (parentId?: string) => void, 
  addArrayField: (parentId?: string) => void, 
  getChildFields: (fieldId: string) => FieldMetadata[] 
}) => {
  const childFields = getChildFields(field.id);
  const isContainer = field.type === FieldType.OBJECT || field.type === FieldType.ARRAY;
  const [isExpanded, setIsExpanded] = useState(level < 1); // 默认展开第一层
  
  const fieldIcon = () => {
    switch (field.type) {
      case FieldType.OBJECT:
        return <span className="text-green-500 font-bold mr-1">{isExpanded ? '▼' : '►'}</span>;
      case FieldType.ARRAY:
        return <span className="text-purple-500 font-bold mr-1">{isExpanded ? '▼' : '►'}</span>;
      case FieldType.STRING:
        return <span className="text-blue-500 mr-1">Aa</span>;
      case FieldType.NUMBER:
        return <span className="text-orange-500 mr-1">123</span>;
      case FieldType.BOOLEAN:
        return <span className="text-red-500 mr-1">tf</span>;
      case FieldType.DATE:
      case FieldType.DATETIME:
        return <span className="text-indigo-500 mr-1">📅</span>;
      default:
        return null;
    }
  };
  
  return (
    <div
      className="border-l-2 border-gray-200 dark:border-gray-700 mb-1 pl-2 py-1"
      style={{ marginLeft: `${level * 8}px` }}
    >
      <div className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md py-1 px-1">
        {isContainer && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-2 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            {fieldIcon()}
          </button>
        )}
        
        <div className="flex-1 grid grid-cols-6 gap-2 items-center">
          <div className="col-span-2 flex items-center">
            {!isContainer && fieldIcon()}
            <input
              type="text"
              className="w-full rounded border border-gray-300 dark:border-gray-600 px-1 py-0.5 text-sm bg-white dark:bg-gray-700"
              value={field.name}
              onChange={e => updateField(field.id, { name: e.target.value })}
              placeholder="字段名称"
              required
            />
          </div>
          
          <select
            className="col-span-1 rounded border border-gray-300 dark:border-gray-600 px-1 py-0.5 text-sm bg-white dark:bg-gray-700"
            value={field.type}
            onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
          >
            {Object.values(FieldType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              id={`required-${field.id}`}
              className="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500 mr-1"
              checked={field.isRequired}
              onChange={e => updateField(field.id, { isRequired: e.target.checked })}
            />
            <label htmlFor={`required-${field.id}`} className="text-xs">必填</label>
          </div>
          
          <input
            type="text"
            className="col-span-2 rounded border border-gray-300 dark:border-gray-600 px-1 py-0.5 text-sm bg-white dark:bg-gray-700"
            value={field.description || ''}
            onChange={e => updateField(field.id, { description: e.target.value })}
            placeholder="描述（可选）"
          />
        </div>
        
        <div className="flex items-center ml-2 space-x-1">
          {isContainer && (
            <>
              <button
                onClick={() => addField(field.id)}
                title="添加普通字段"
                className="p-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button
                onClick={() => addObjectField(field.id)}
                title="添加对象字段"
                className="p-0.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs"
              >
                <FontAwesomeIcon icon={faIndent} />
              </button>
              <button
                onClick={() => addArrayField(field.id)}
                title="添加数组字段"
                className="p-0.5 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-xs"
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </>
          )}
          <button
            onClick={() => removeField(field.id)}
            title="删除字段"
            className="p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>
      
      {isContainer && isExpanded && childFields.length > 0 && (
        <div className="ml-2 mt-1 border-l border-gray-200 dark:border-gray-700 pl-2">
          {childFields.map(childField => (
            <FieldItem
              key={childField.id}
              field={childField}
              level={level + 1}
              updateField={updateField}
              removeField={removeField}
              addField={addField}
              addObjectField={addObjectField}
              addArrayField={addArrayField}
              getChildFields={getChildFields}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ThirdPartyModelPage = () => {
  const { 
    domains, 
    thirdPartyModels, 
    addThirdPartyModel, 
    updateThirdPartyModel, 
    deleteThirdPartyModel 
  } = useAppStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState<string>('');
  
  // 表单状态
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [modelDomain, setModelDomain] = useState('');
  const [modelFormat, setModelFormat] = useState<'json' | 'xml'>('json');
  const [modelFields, setModelFields] = useState<FieldMetadata[]>([]);
  
  // 数据导入状态
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 重置表单
  const resetForm = () => {
    setModelName('');
    setModelDescription('');
    setModelDomain(domains.length > 0 ? domains[0].id : '');
    setModelFormat('json');
    setModelFields([]);
    setCurrentModelId(null);
  };
  
  // 打开创建模态框
  const openCreateModal = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };
  
  // 打开编辑模态框
  const openEditModal = (model: ThirdPartyModel) => {
    setModelName(model.name);
    setModelDescription(model.description || '');
    setModelDomain(model.domainId);
    setModelFormat(model.format);
    setModelFields(model.fields || []);
    setCurrentModelId(model.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };
  
  // 添加普通字段
  const addField = (parentId?: string) => {
    const newField: FieldMetadata = {
      id: generateId(),
      name: '',
      description: '',
      type: FieldType.STRING,
      isRequired: false
    };
    
    if (parentId) {
      newField.parentId = parentId;
    }
    
    setModelFields([...modelFields, newField]);
  };
  
  // 添加对象字段
  const addObjectField = (parentId?: string) => {
    const newField: FieldMetadata = {
      id: generateId(),
      name: '',
      description: '',
      type: FieldType.OBJECT,
      isRequired: false
    };
    
    if (parentId) {
      newField.parentId = parentId;
    }
    
    setModelFields([...modelFields, newField]);
  };
  
  // 添加数组字段
  const addArrayField = (parentId?: string) => {
    const newField: FieldMetadata = {
      id: generateId(),
      name: '',
      description: '',
      type: FieldType.ARRAY,
      isRequired: false
    };
    
    if (parentId) {
      newField.parentId = parentId;
    }
    
    setModelFields([...modelFields, newField]);
  };
  
  // 更新字段
  const updateField = (id: string, updates: Partial<FieldMetadata>) => {
    const updatedFields = modelFields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    );
    setModelFields(updatedFields);
  };
  
  // 删除字段（包括子字段）
  const removeField = (id: string) => {
    // 递归获取所有子字段ID
    const getChildrenIds = (fieldId: string): string[] => {
      const childrenFields = modelFields.filter(f => f.parentId === fieldId);
      return [
        ...childrenFields.map(f => f.id),
        ...childrenFields.flatMap(f => getChildrenIds(f.id))
      ];
    };
    
    const childrenIds = getChildrenIds(id);
    const allIdsToRemove = [id, ...childrenIds];
    
    const updatedFields = modelFields.filter(field => !allIdsToRemove.includes(field.id));
    setModelFields(updatedFields);
  };
  
  // 获取字段的子字段
  const getChildFields = (fieldId: string) => {
    return modelFields.filter(field => field.parentId === fieldId);
  };
  
  // 获取顶级字段
  const getTopLevelFields = () => {
    return modelFields.filter(field => !field.parentId);
  };
  
  // 处理JSON导入
  const handleJsonImport = () => {
    try {
      // 尝试解析JSON
      const jsonObj = JSON.parse(importText);
      
      // 生成字段元数据
      const generatedFields = generateFieldsFromJson(jsonObj);
      
      // 更新字段状态
      setModelFields(generatedFields);
      
      // 关闭导入模态框
      setShowImportModal(false);
      setImportText('');
      
      // 显示成功消息
      showSuccess('已成功解析JSON并生成元数据!');
    } catch (error) {
      showError(`解析JSON失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };
  
  // 处理XML导入
  const handleXmlImport = async () => {
    try {
      // 生成字段元数据
      const generatedFields = await generateFieldsFromXml(importText);
      
      // 更新字段状态
      setModelFields(generatedFields);
      
      // 关闭导入模态框
      setShowImportModal(false);
      setImportText('');
      
      // 显示成功消息
      showSuccess('已成功解析XML并生成元数据!');
    } catch (error) {
      showError(`解析XML失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };
  
  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setImportText(content);
      
      // 根据文件类型自动检测格式
      if (file.name.endsWith('.json')) {
        setModelFormat('json');
      } else if (file.name.endsWith('.xml')) {
        setModelFormat('xml');
      }
    };
    reader.readAsText(file);
  };
  
  // 保存模型
  const saveModel = () => {
    // 验证表单
    if (!modelName) {
      showError('请输入模型名称');
      return;
    }
    
    if (!modelDomain) {
      showError('请选择数据领域');
      return;
    }
    
    // 验证字段信息
    for (const field of modelFields) {
      if (!field.name) {
        showError('所有字段必须有名称');
        return;
      }
    }
    
    const now = new Date().toISOString();
    
    if (isEditMode && currentModelId) {
      // 更新模型
      const updatedModel: ThirdPartyModel = {
        id: currentModelId,
        name: modelName,
        description: modelDescription,
        domainId: modelDomain,
        format: modelFormat,
        fields: modelFields,
        createdAt: thirdPartyModels.find(m => m.id === currentModelId)?.createdAt || now,
        updatedAt: now
      };
      
      updateThirdPartyModel(updatedModel);
      showSuccess('第三方数据模型已更新!');
    } else {
      // 创建新模型
      const newModel: ThirdPartyModel = {
        id: generateId(),
        name: modelName,
        description: modelDescription,
        domainId: modelDomain,
        format: modelFormat,
        fields: modelFields,
        createdAt: now,
        updatedAt: now
      };
      
      addThirdPartyModel(newModel);
      showSuccess('第三方数据模型已创建!');
    }
    
    // 关闭模态框并重置表单
    setIsModalOpen(false);
    resetForm();
  };
  
  // 处理删除模型
  const handleDeleteModel = (modelId: string) => {
    if (window.confirm('确定要删除此模型吗？此操作不可撤销。')) {
      deleteThirdPartyModel(modelId);
    }
  };
  
  // 获取领域名称
  const getDomainName = (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    return domain ? domain.name : '未知领域';
  };
  
  // 过滤后的模型列表
  const filteredModels = thirdPartyModels.filter(model => {
    let matchesSearch = true;
    let matchesDomain = true;
    
    if (searchTerm) {
      matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (model.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    if (filterDomain) {
      matchesDomain = model.domainId === filterDomain;
    }
    
    return matchesSearch && matchesDomain;
  });
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-white">第三方数据元数据设计</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            新建模型
          </button>
        </div>
        
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索模型..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
            
            <div className="flex items-center">
              <FontAwesomeIcon icon={faFilter} className="mr-2 text-gray-400" />
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                value={filterDomain}
                onChange={e => setFilterDomain(e.target.value)}
              >
                <option value="">所有领域</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>{domain.name}</option>
                ))}
              </select>
            </div>
            
            <div className="text-right">
              <span className="text-gray-500 dark:text-gray-400">
                共 {filteredModels.length} 个模型
              </span>
            </div>
          </div>
        </div>
        
        {filteredModels.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400 mb-4">暂无第三方数据模型</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              新建模型
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map(model => (
              <div key={model.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{model.name}</h2>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getDomainName(model.domainId)}
                      </span>
                      <span className={`text-sm ${model.format === 'json' ? 'text-blue-500' : 'text-orange-500'}`}>
                        {model.format.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(model)}
                      className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md"
                      title="编辑"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-md"
                      title="删除"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {model.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{model.description}</p>
                  )}
                  <div className="mb-2">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">字段数量</div>
                    <div className="text-xl font-bold">{model.fields.length}</div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">创建时间</div>
                    <div className="text-sm">{new Date(model.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">最后更新</div>
                    <div className="text-sm">{new Date(model.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 创建/编辑模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold">
                {isEditMode ? '编辑第三方数据模型' : '创建第三方数据模型'}
              </h2>
            </div>
            
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 10rem)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">模型名称</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    value={modelName}
                    onChange={e => setModelName(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-medium">数据领域</label>
                  <select
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    value={modelDomain}
                    onChange={e => setModelDomain(e.target.value)}
                    required
                  >
                    <option value="">-- 选择领域 --</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.id}>{domain.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block mb-1 font-medium">描述</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    value={modelDescription}
                    onChange={e => setModelDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-medium">数据格式</label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        className="mr-2"
                        name="format"
                        value="json"
                        checked={modelFormat === 'json'}
                        onChange={e => setModelFormat(e.target.value as 'json' | 'xml')}
                      />
                      JSON
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        className="mr-2"
                        name="format"
                        value="xml"
                        checked={modelFormat === 'xml'}
                        onChange={e => setModelFormat(e.target.value as 'json' | 'xml')}
                      />
                      XML
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4 mt-6">
                <h3 className="text-xl font-bold">字段定义</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faFileImport} className="mr-2" />
                    导入{modelFormat.toUpperCase()}
                  </button>
                  <button
                    onClick={() => addField()}
                    title="添加普通字段"
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    添加字段
                  </button>
                  <button
                    onClick={() => addObjectField()}
                    title="添加对象字段"
                    className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faIndent} className="mr-2" />
                    添加对象
                  </button>
                  <button
                    onClick={() => addArrayField()}
                    title="添加数组字段"
                    className="px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faList} className="mr-2" />
                    添加数组
                  </button>
                </div>
              </div>
              
              <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900">
                <div className="grid grid-cols-6 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-12">
                  <div className="col-span-2">字段名称</div>
                  <div className="col-span-1">类型</div>
                  <div className="col-span-1">必填</div>
                  <div className="col-span-2">描述</div>
                </div>
                
                {getTopLevelFields().length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    还没有定义字段。请使用上方按钮添加字段，或导入JSON/XML自动生成字段。
                  </div>
                ) : (
                  getTopLevelFields().map(field => (
                    <FieldItem
                      key={field.id}
                      field={field}
                      updateField={updateField}
                      removeField={removeField}
                      addField={addField}
                      addObjectField={addObjectField}
                      addArrayField={addArrayField}
                      getChildFields={getChildFields}
                    />
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveModel}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold">导入{modelFormat.toUpperCase()}生成元数据</h2>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block mb-1 font-medium">上传文件</label>
                <div className="flex items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={modelFormat === 'json' ? '.json' : '.xml'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    选择文件
                  </button>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    {fileInputRef.current?.files?.[0]?.name || `支持${modelFormat.toUpperCase()}格式`}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-1 font-medium">或直接粘贴{modelFormat.toUpperCase()}内容</label>
                <textarea
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 font-mono text-sm"
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  rows={10}
                  placeholder={`请粘贴${modelFormat.toUpperCase()}内容...`}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={modelFormat === 'json' ? handleJsonImport : handleXmlImport}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                disabled={!importText.trim()}
              >
                <FontAwesomeIcon icon={faFileCode} className="mr-2" />
                解析{modelFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ThirdPartyModelPage; 