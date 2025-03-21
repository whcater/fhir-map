import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faSearch,
  faFilter,
  faSave
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../layouts/MainLayout';
import { useAppStore } from '../store';
import { LogicDtoModel, DataDomain, FieldType } from '../types';
import { generateId } from '../utils/helpers';

const LogicModelPage = () => {
  const { domains, logicDtoModels, addLogicDtoModel, updateLogicDtoModel, deleteLogicDtoModel } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<LogicDtoModel | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [modelDomainId, setModelDomainId] = useState('');
  const [modelFields, setModelFields] = useState<{
    id: string;
    name: string;
    description: string;
    type: FieldType;
    isRequired: boolean;
    parentId?: string;
  }[]>([]);
  
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
  const addField = () => {
    const newField = {
      id: generateId(),
      name: '',
      description: '',
      type: FieldType.STRING,
      isRequired: false
    };
    setModelFields([...modelFields, newField]);
  };
  
  // 更新字段
  const updateField = (index: number, field: any) => {
    const updatedFields = [...modelFields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setModelFields(updatedFields);
  };
  
  // 删除字段
  const removeField = (index: number) => {
    const updatedFields = [...modelFields];
    updatedFields.splice(index, 1);
    setModelFields(updatedFields);
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
                  <button
                    onClick={addField}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded flex items-center text-sm"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                    添加字段
                  </button>
                </div>
                
                {modelFields.length > 0 ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">字段名称</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">字段类型</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">必填</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">描述</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {modelFields.map((field, index) => (
                          <tr key={field.id}>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700"
                                value={field.name}
                                onChange={e => updateField(index, { name: e.target.value })}
                                placeholder="字段名称"
                                required
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700"
                                value={field.type}
                                onChange={e => updateField(index, { type: e.target.value as FieldType })}
                              >
                                {Object.values(FieldType).map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500"
                                checked={field.isRequired}
                                onChange={e => updateField(index, { isRequired: e.target.checked })}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700"
                                value={field.description}
                                onChange={e => updateField(index, { description: e.target.value })}
                                placeholder="描述（可选）"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => removeField(index)}
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
                  <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      还没有添加字段
                    </p>
                    <button
                      onClick={addField}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded inline-flex items-center text-sm"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-1" />
                      添加字段
                    </button>
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
    </MainLayout>
  );
};

export default LogicModelPage; 