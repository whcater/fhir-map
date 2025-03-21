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
  faList
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../layouts/MainLayout';
import { useAppStore } from '../store';
import { LogicDtoModel, DataDomain, FieldType, FieldMetadata } from '../types';
import { generateId } from '../utils/helpers';
import { generateFieldsFromJson } from '../utils';

const LogicModelPage = () => {
  const { domains, logicDtoModels, addLogicDtoModel, updateLogicDtoModel, deleteLogicDtoModel } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<LogicDtoModel | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [modelDomainId, setModelDomainId] = useState('');
  const [modelFields, setModelFields] = useState<FieldMetadata[]>([]);
  const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 重置表单
  const resetForm = () => {
    setModelName('');
    setModelDescription('');
    setModelDomainId(domains[0]?.id || '');
    setModelFields([]);
    setCurrentModel(null);
  };
  
  // 打开新建模型的模态框
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  // 打开编辑模型的模态框
  const openEditModal = (model: LogicDtoModel) => {
    setCurrentModel(model);
    setModelName(model.name);
    setModelDescription(model.description || '');
    setModelDomainId(model.domainId);
    setModelFields([...model.fields]);
    setIsModalOpen(true);
  };
  
  // 添加字段
  const addField = (parentId?: string) => {
    const newField: FieldMetadata = {
      id: generateId(),
      name: '',
      description: '',
      type: FieldType.STRING,
      isRequired: false,
    };
    
    if (parentId) {
      newField.parentId = parentId;
    }
    
    setModelFields([...modelFields, newField]);
  };
  
  // 添加子对象字段
  const addObjectField = (parentId?: string) => {
    const newField: FieldMetadata = {
      id: generateId(),
      name: '',
      description: '',
      type: FieldType.OBJECT,
      isRequired: false,
      children: []
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
      isRequired: false,
      children: []
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
      setJsonError('');
      const jsonData = JSON.parse(jsonInput);
      
      // 生成字段
      const generatedFields = generateFieldsFromJson(jsonData);
      
      if (generatedFields.length > 0) {
        setModelFields(prevFields => [...prevFields, ...generatedFields]);
        setIsJsonImportModalOpen(false);
        setJsonInput('');
      } else {
        setJsonError('无法从JSON生成有效字段');
      }
    } catch (error) {
      setJsonError('JSON格式无效: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setJsonError('');
        const content = e.target?.result as string;
        setJsonInput(content);
      } catch (error) {
        setJsonError('文件读取错误: ' + (error instanceof Error ? error.message : String(error)));
      }
    };
    reader.onerror = () => {
      setJsonError('文件读取失败');
    };
    reader.readAsText(file);
  };
  
  // 保存模型
  const saveModel = () => {
    if (!modelName.trim() || !modelDomainId || modelFields.length === 0) {
      alert('请填写必要信息并至少添加一个字段');
      return;
    }
    
    // 检查字段是否都有名称
    const invalidFields = modelFields.filter(field => !field.name.trim());
    if (invalidFields.length > 0) {
      alert('所有字段必须有名称');
      return;
    }
    
    const now = new Date().toISOString();
    if (currentModel) {
      // 更新现有模型
      const updatedModel: LogicDtoModel = {
        ...currentModel,
        name: modelName,
        description: modelDescription,
        domainId: modelDomainId,
        fields: modelFields,
        updatedAt: now
      };
      updateLogicDtoModel(updatedModel);
    } else {
      // 创建新模型
      const newModel: LogicDtoModel = {
        id: generateId(),
        name: modelName,
        description: modelDescription,
        domainId: modelDomainId,
        fields: modelFields,
        createdAt: now,
        updatedAt: now
      };
      addLogicDtoModel(newModel);
    }
    
    setIsModalOpen(false);
    resetForm();
  };
  
  // 删除模型
  const handleDeleteModel = (modelId: string) => {
    if (confirm('确定要删除此模型吗？')) {
      deleteLogicDtoModel(modelId);
    }
  };
  
  // 根据搜索和筛选条件过滤模型
  const filteredModels = logicDtoModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (model.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain ? model.domainId === selectedDomain : true;
    return matchesSearch && matchesDomain;
  });
  
  // 根据id获取领域名称
  const getDomainName = (domainId: string) => {
    return domains.find(domain => domain.id === domainId)?.name || '未知领域';
  };
  
  // 递归渲染字段及其子字段
  const renderField = (field: FieldMetadata, level = 0) => {
    const childFields = getChildFields(field.id);
    const isContainer = field.type === FieldType.OBJECT || field.type === FieldType.ARRAY;
    
    return (
      <div key={field.id} className="border border-gray-200 dark:border-gray-700 rounded-md mb-2 overflow-hidden">
        <div className={`bg-gray-50 dark:bg-gray-800 p-2 ${level > 0 ? 'pl-' + (level * 4) : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 grid grid-cols-4 gap-2">
              <input
                type="text"
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700"
                value={field.name}
                onChange={e => updateField(field.id, { name: e.target.value })}
                placeholder="字段名称"
                required
              />
              <select
                className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700"
                value={field.type}
                onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
              >
                {Object.values(FieldType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`required-${field.id}`}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500 mr-2"
                  checked={field.isRequired}
                  onChange={e => updateField(field.id, { isRequired: e.target.checked })}
                />
                <label htmlFor={`required-${field.id}`} className="text-sm">必填</label>
              </div>
              <input
                type="text"
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700"
                value={field.description || ''}
                onChange={e => updateField(field.id, { description: e.target.value })}
                placeholder="描述（可选）"
              />
            </div>
            <div className="flex items-center ml-2">
              {isContainer && (
                <div className="flex space-x-1 mr-2">
                  <button
                    onClick={() => addField(field.id)}
                    title="添加普通字段"
                    className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                  <button
                    onClick={() => addObjectField(field.id)}
                    title="添加对象字段"
                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs"
                  >
                    <FontAwesomeIcon icon={faIndent} />
                  </button>
                  <button
                    onClick={() => addArrayField(field.id)}
                    title="添加数组字段"
                    className="p-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-xs"
                  >
                    <FontAwesomeIcon icon={faList} />
                  </button>
                </div>
              )}
              <button
                onClick={() => removeField(field.id)}
                title="删除字段"
                className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        </div>
        
        {childFields.length > 0 && (
          <div className="pl-4 pr-2 py-2 border-t border-gray-200 dark:border-gray-700">
            {childFields.map(childField => renderField(childField, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold">逻辑模型设计</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            新建模型
          </button>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="搜索模型..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
            >
              <option value="">所有领域</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>{domain.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 模型列表 */}
        {filteredModels.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    领域
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    字段数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    更新时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredModels.map(model => (
                  <tr 
                    key={model.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {model.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getDomainName(model.domainId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {model.fields.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(model.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => openEditModal(model)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || selectedDomain ? '没有符合条件的模型' : '还没有创建任何逻辑模型'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md inline-flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              创建第一个模型
            </button>
          </div>
        )}
      </div>
      
      {/* 模型编辑模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {currentModel ? '编辑逻辑模型' : '创建新逻辑模型'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      模型名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700"
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                      placeholder="请输入模型名称"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      所属领域 <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700"
                      value={modelDomainId}
                      onChange={e => setModelDomainId(e.target.value)}
                      required
                    >
                      <option value="" disabled>请选择领域</option>
                      {domains.map(domain => (
                        <option key={domain.id} value={domain.id}>{domain.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    模型描述
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700"
                    value={modelDescription}
                    onChange={e => setModelDescription(e.target.value)}
                    placeholder="请输入模型描述（可选）"
                    rows={3}
                  />
                </div>
              </div>
              
              {/* 字段列表 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">字段定义</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsJsonImportModalOpen(true)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center text-sm"
                    >
                      <FontAwesomeIcon icon={faUpload} className="mr-1" />
                      导入JSON
                    </button>
                    <button
                      onClick={() => addField()}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded flex items-center text-sm"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-1" />
                      添加字段
                    </button>
                    <button
                      onClick={() => addObjectField()}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded flex items-center text-sm"
                    >
                      <FontAwesomeIcon icon={faIndent} className="mr-1" />
                      添加对象
                    </button>
                    <button
                      onClick={() => addArrayField()}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded flex items-center text-sm"
                    >
                      <FontAwesomeIcon icon={faList} className="mr-1" />
                      添加数组
                    </button>
                  </div>
                </div>
                
                {getTopLevelFields().length > 0 ? (
                  <div className="space-y-2">
                    {getTopLevelFields().map(field => renderField(field))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      还没有添加字段
                    </p>
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => addField()}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded inline-flex items-center text-sm"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-1" />
                        添加字段
                      </button>
                      <button
                        onClick={() => setIsJsonImportModalOpen(true)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded inline-flex items-center text-sm"
                      >
                        <FontAwesomeIcon icon={faUpload} className="mr-1" />
                        导入JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mr-2"
              >
                取消
              </button>
              <button
                onClick={saveModel}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md flex items-center"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* JSON导入模态框 */}
      {isJsonImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">导入JSON数据</h2>
              <button
                onClick={() => {
                  setIsJsonImportModalOpen(false);
                  setJsonInput('');
                  setJsonError('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  JSON数据
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700"
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  placeholder="请输入或粘贴JSON数据"
                  rows={10}
                />
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faUpload} className="mr-2" />
                  上传JSON文件
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  或者直接粘贴JSON数据到上面的文本框
                </span>
              </div>
              
              {jsonError && (
                <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
                  {jsonError}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setIsJsonImportModalOpen(false);
                  setJsonInput('');
                  setJsonError('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mr-2"
              >
                取消
              </button>
              <button
                onClick={handleJsonImport}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md flex items-center"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default LogicModelPage; 