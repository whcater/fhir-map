import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { MappingConfiguration, LogicDtoModel, FieldMetadata, FieldMapping, ThirdPartyModel, DataDomain } from '../types';
import { nanoid } from 'nanoid';

const MappingConfigPage: React.FC = () => {
  const { 
    domains, 
    logicDtoModels, 
    mappingConfigurations,
    addMappingConfiguration,
    updateMappingConfiguration
  } = useAppStore();
  
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedLogicModel, setSelectedLogicModel] = useState<string>('');
  const [activeMapping, setActiveMapping] = useState<MappingConfiguration | null>(null);
  const [jsonEditorValue, setJsonEditorValue] = useState<string>('{\n  "resourceType": "Patient",\n  "id": "example",\n  "name": [\n    {\n      "use": "official",\n      "family": "张",\n      "given": ["三"]\n    }\n  ],\n  "gender": "male",\n  "birthDate": "1974-12-25"\n}');
  const [hoveredPath, setHoveredPath] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mappingView, setMappingView] = useState<'visual' | 'table'>('visual');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const jsonEditorRef = useRef<HTMLDivElement>(null);
  const pathInputRef = useRef<HTMLInputElement>(null);
  
  // 加载或创建映射配置
  useEffect(() => {
    // 模拟获取数据
    if (selectedDomain && selectedLogicModel) {
      const existingMapping = mappingConfigurations.find(
        (m: MappingConfiguration) => m.domainId === selectedDomain && 
             m.sourceModelId === selectedLogicModel && 
             m.targetType === 'fhir'
      );
      
      if (existingMapping) {
        setActiveMapping(existingMapping);
      } else {
        // 创建新的映射配置
        const newMapping: MappingConfiguration = {
          id: nanoid(),
          name: `${logicDtoModels.find((m: LogicDtoModel) => m.id === selectedLogicModel)?.name || 'Unknown'} to FHIR Mapping`,
          description: '逻辑模型到FHIR资源的映射配置',
          domainId: selectedDomain,
          sourceType: 'logicDto',
          targetType: 'fhir',
          sourceModelId: selectedLogicModel,
          targetModelId: 'fhir',
          fieldMappings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setActiveMapping(newMapping);
      }
    } else {
      setActiveMapping(null);
    }
  }, [selectedDomain, selectedLogicModel, mappingConfigurations, logicDtoModels]);
  
  // 模拟从JSON编辑器获取FHIR Path
  const handleGetPathFromCursor = () => {
    // 这里是模拟实现，实际需要根据编辑器光标位置计算FHIR Path
    const mockPath = hoveredPath || 'Patient.name[0].family';
    setSelectedPath(mockPath);
    if (pathInputRef.current) {
      pathInputRef.current.value = mockPath;
    }
  };
  
  // 保存映射
  const handleSaveMapping = () => {
    if (!activeMapping) return;
    
    const isNew = !mappingConfigurations.some((m: MappingConfiguration) => m.id === activeMapping.id);
    
    if (isNew) {
      addMappingConfiguration(activeMapping);
    } else {
      updateMappingConfiguration(activeMapping);
    }
    
    alert('映射配置已保存！');
  };
  
  // 添加字段映射
  const handleAddFieldMapping = (logicField: FieldMetadata, fhirPath: string) => {
    if (!activeMapping) return;
    
    const newMapping: FieldMapping = {
      sourceFieldId: logicField.id,
      targetFieldId: fhirPath,
      transformationRule: ''
    };
    
    setActiveMapping({
      ...activeMapping,
      fieldMappings: [...activeMapping.fieldMappings, newMapping],
      updatedAt: new Date().toISOString()
    });
  };
  
  // 删除字段映射
  const handleRemoveFieldMapping = (sourceFieldId: string) => {
    if (!activeMapping) return;
    
    setActiveMapping({
      ...activeMapping,
      fieldMappings: activeMapping.fieldMappings.filter((m: FieldMapping) => m.sourceFieldId !== sourceFieldId),
      updatedAt: new Date().toISOString()
    });
  };
  
  // 设置模拟的JSON编辑器的鼠标悬停效果
  const handleEditorHover = (path: string) => {
    setHoveredPath(path);
  };
  
  // 过滤逻辑模型字段
  const filteredFields = (model?: LogicDtoModel) => {
    if (!model) return [];
    
    const filterFields = (fields: FieldMetadata[], parentPath = ''): FieldMetadata[] => {
      return fields.filter(field => {
        const fullName = parentPath ? `${parentPath}.${field.name}` : field.name;
        return !searchTerm || fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
               (field.description && field.description.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    };
    
    return filterFields(model.fields);
  };
  
  // 获取字段的FHIR映射路径
  const getFieldFhirPath = (fieldId: string): string => {
    if (!activeMapping) return '';
    const mapping = activeMapping.fieldMappings.find((f: FieldMapping) => f.sourceFieldId === fieldId);
    return mapping ? mapping.targetFieldId : '';
  };
  
  // 渲染递归树形逻辑模型字段
  const renderLogicFields = (fields: FieldMetadata[], parentPath = '', level = 0) => {
    return filteredFields({ id: '', name: '', domainId: '', fields, createdAt: '', updatedAt: '' }).map(field => {
      const fullPath = parentPath ? `${parentPath}.${field.name}` : field.name;
      const fhirPath = getFieldFhirPath(field.id);
      
      return (
        <div key={field.id} className={`pl-${level * 4} py-2 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className={`fas ${field.type === 'object' ? 'fa-folder' : field.type === 'array' ? 'fa-list' : 'fa-tag'} mr-2 text-blue-500`}></i>
              <span className="font-medium">{field.name}</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({field.type})</span>
              {field.description && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{field.description}</span>}
            </div>
            
            <div className="flex items-center">
              {fhirPath ? (
                <div className="flex items-center">
                  <span className="text-sm text-green-600 dark:text-green-400 mr-2">{fhirPath}</span>
                  <button 
                    onClick={() => handleRemoveFieldMapping(field.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    if (selectedPath) {
                      handleAddFieldMapping(field, selectedPath);
                      setSelectedPath('');
                      if (pathInputRef.current) {
                        pathInputRef.current.value = '';
                      }
                    }
                  }}
                  disabled={!selectedPath}
                  className={`px-3 py-1 text-xs rounded-full ${selectedPath ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'}`}
                >
                  <i className="fas fa-link mr-1"></i>
                  映射
                </button>
              )}
            </div>
          </div>
          
          {field.children && field.children.length > 0 && renderLogicFields(field.children, fullPath, level + 1)}
        </div>
      );
    });
  };
  
  // 模拟JSON编辑器区域（实际应用中应使用Monaco Editor或JSON编辑器组件）
  const renderJsonEditor = () => {
    const jsonPaths = [
      'Patient',
      'Patient.id',
      'Patient.name[0]',
      'Patient.name[0].use',
      'Patient.name[0].family',
      'Patient.name[0].given[0]',
      'Patient.gender',
      'Patient.birthDate'
    ];
    
    return (
      <div 
        ref={jsonEditorRef}
        className="relative w-full h-full p-4 font-mono text-sm overflow-auto bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md" 
      >
        <pre className="whitespace-pre-wrap">
          {jsonEditorValue.split('\n').map((line, i) => {
            // 为每行寻找对应的路径（这是模拟实现）
            const linePathIndex = Math.min(i, jsonPaths.length - 1);
            const linePath = jsonPaths[linePathIndex];
            
            return (
              <div 
                key={i}
                onMouseEnter={() => handleEditorHover(linePath)}
                onMouseLeave={() => handleEditorHover('')}
                onClick={() => setSelectedPath(linePath)}
                className={`px-1 ${selectedPath === linePath ? 'bg-yellow-200 dark:bg-yellow-900' : hoveredPath === linePath ? 'bg-blue-100 dark:bg-blue-900' : ''} cursor-pointer`}
              >
                {line}
              </div>
            );
          })}
        </pre>
      </div>
    );
  };
  
  // 渲染视觉映射视图
  const renderVisualMapping = () => {
    if (!activeMapping || !selectedLogicModel) return <div className="p-4 text-center text-gray-500">请先选择域和逻辑模型</div>;
    
    const model = logicDtoModels.find((m: LogicDtoModel) => m.id === selectedLogicModel);
    if (!model) return <div className="p-4 text-center text-gray-500">未找到选择的逻辑模型</div>;
    
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
          <div className="flex items-center space-x-2">
            <i className="fas fa-filter text-blue-500"></i>
            <input
              type="text"
              placeholder="搜索字段..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <button
              onClick={() => setMappingView('visual')}
              className={`px-3 py-1 mx-1 rounded-md ${mappingView === 'visual' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              <i className="fas fa-sitemap mr-1"></i>
              视觉
            </button>
            <button
              onClick={() => setMappingView('table')}
              className={`px-3 py-1 mx-1 rounded-md ${mappingView === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              <i className="fas fa-table mr-1"></i>
              表格
            </button>
          </div>
        </div>
        
        {mappingView === 'visual' ? (
          <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-md">
            {renderLogicFields(model.fields)}
          </div>
        ) : (
          <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">逻辑模型字段</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">FHIR Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {activeMapping.fieldMappings.map((mapping) => {
                  const field = model.fields.find((f: FieldMetadata) => f.id === mapping.sourceFieldId);
                  return field ? (
                    <tr key={mapping.sourceFieldId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{field.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{mapping.targetFieldId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button onClick={() => handleRemoveFieldMapping(mapping.sourceFieldId)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <i className="fas fa-project-diagram text-blue-500 mr-2"></i>
            FHIR 映射配置
          </h1>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            
            <div>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="mr-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择数据域...</option>
                {domains.map((domain: DataDomain) => (
                  <option key={domain.id} value={domain.id}>{domain.name}</option>
                ))}
              </select>
              
              <select
                value={selectedLogicModel}
                onChange={(e) => setSelectedLogicModel(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedDomain}
              >
                <option value="">选择逻辑模型...</option>
                {logicDtoModels
                  .filter((model: LogicDtoModel) => !selectedDomain || model.domainId === selectedDomain)
                  .map((model: LogicDtoModel) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* 左侧：逻辑模型面板 */}
        <div className="w-full md:w-1/2 p-4 overflow-hidden flex flex-col h-full bg-white dark:bg-gray-800">
          <div className="flex-1 overflow-hidden">
            <div className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
              <i className="fas fa-sitemap mr-2 text-blue-500"></i>
              <span>逻辑模型映射</span>
            </div>
            
            {renderVisualMapping()}
          </div>
        </div>
        
        {/* 右侧：FHIR资源编辑器面板 */}
        <div className="w-full md:w-1/2 p-4 overflow-hidden flex flex-col bg-white dark:bg-gray-800 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
          <div className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
            <i className="fas fa-code mr-2 text-blue-500"></i>
            <span>FHIR 资源</span>
          </div>
          
          <div className="mb-4 flex items-center space-x-2">
            <input
              ref={pathInputRef}
              type="text"
              placeholder="FHIR Path"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={handleGetPathFromCursor}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <i className="fas fa-magic mr-1"></i>
              从编辑器获取
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden border border-gray-200 dark:border-gray-700 rounded-md">
            {renderJsonEditor()}
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-900 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              已映射 <span className="font-medium text-blue-500">{activeMapping?.fieldMappings.length || 0}</span> 个字段
            </span>
          </div>
          
          <div>
            <button
              onClick={handleSaveMapping}
              disabled={!activeMapping}
              className={`px-4 py-2 rounded-md ${!activeMapping ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            >
              <i className="fas fa-save mr-1"></i>
              保存映射
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MappingConfigPage; 