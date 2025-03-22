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
  
  // 添加一个新的组件或状态来处理高级FHIR Path生成
  const [showFhirPathBuilder, setShowFhirPathBuilder] = useState<boolean>(false);
  const [availableResources, setAvailableResources] = useState<Array<{type: string, example: string}>>([
    { type: 'Patient', example: 'Patient.name[0].family' },
    { type: 'Medication', example: 'Medication.code.coding[0].display' },
    { type: 'MedicationRequest', example: 'MedicationRequest.dosageInstruction[0].text' },
    { type: 'Organization', example: 'Organization.name' },
    { type: 'Practitioner', example: 'Practitioner.name[0].given[0]' },
    { type: 'PractitionerRole', example: 'PractitionerRole.specialty[0].coding[0].display' },
    { type: 'Composition', example: 'Composition.section[0].title' }
  ]);
  const [pathComponents, setPathComponents] = useState<Array<{type: string, path: string}>>([]);
  const [builtPath, setBuiltPath] = useState<string>('');
  
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
    // 首先，将字段按层次结构整理
    const rootFields = fields.filter(field => !field.parentId);
    
    const getChildFields = (parentId: string) => {
      return fields.filter(field => field.parentId === parentId);
    };
    
    const renderField = (field: FieldMetadata, fieldPath = '', fieldLevel = 0) => {
      const fullPath = fieldPath ? `${fieldPath}.${field.name}` : field.name;
      const fhirPath = getFieldFhirPath(field.id);
      const childFields = getChildFields(field.id);
      
      return (
        <div key={field.id} className="border-b border-gray-200 dark:border-gray-700">
          <div 
            className={`py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between`}
            style={{ paddingLeft: `${(fieldLevel * 1.5) + 0.5}rem` }}
          >
            <div className="flex items-center flex-1">
              {childFields.length > 0 ? (
                <i className="fas fa-folder mr-2 text-blue-500"></i>
              ) : field.type === 'array' ? (
                <i className="fas fa-list mr-2 text-indigo-500"></i>
              ) : (
                <i className="fas fa-tag mr-2 text-green-500"></i>
              )}
              <div className="flex flex-col">
                <span className="font-medium">{field.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {field.type} {field.description && `- ${field.description}`}
                </span>
              </div>
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
          
          {childFields.length > 0 && (
            <div className="pl-4 border-l border-gray-200 dark:border-gray-700 ml-4">
              {childFields.map(childField => renderField(childField, fullPath, fieldLevel + 1))}
            </div>
          )}
        </div>
      );
    };
    
    return rootFields.map(field => renderField(field, parentPath, level));
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
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">路径</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">FHIR Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {renderTableRows(model.fields)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  // 添加渲染表格行的函数
  const renderTableRows = (fields: FieldMetadata[]) => {
    // 构建扁平化的字段列表，包含完整路径
    const flattenedFields: Array<{field: FieldMetadata, fullPath: string}> = [];
    
    const flattenFields = (fieldList: FieldMetadata[], parentPath = '') => {
      fieldList.forEach(field => {
        const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name;
        flattenedFields.push({ field, fullPath: currentPath });
        
        // 查找此字段的子字段
        const childFields = fields.filter(f => f.parentId === field.id);
        if (childFields.length > 0) {
          flattenFields(childFields, currentPath);
        }
      });
    };
    
    // 获取根字段（没有parentId的字段）
    const rootFields = fields.filter(field => !field.parentId);
    flattenFields(rootFields);
    
    // 按路径排序
    flattenedFields.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
    
    // 渲染行
    return flattenedFields.map(({ field, fullPath }) => {
      const fhirPath = getFieldFhirPath(field.id);
      
      return (
        <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
            {fullPath}
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {field.type}
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
            {fhirPath || "-"}
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {fhirPath ? (
              <button 
                onClick={() => handleRemoveFieldMapping(field.id)} 
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
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
          </td>
        </tr>
      );
    });
  };
  
  // 复杂FHIR Path生成功能
  const addPathComponent = (type: string, path: string) => {
    // 将组件添加到路径
    setPathComponents([...pathComponents, { type, path }]);
    
    // 重新构建完整路径
    let newPath = '';
    if (pathComponents.length === 0) {
      // 第一个组件
      newPath = path;
    } else {
      // 根据之前的路径构建
      const lastPath = pathComponents[pathComponents.length - 1].path;
      
      // 检查是否添加引用解析
      if (path.startsWith('reference.resolve')) {
        newPath = `${lastPath}.${path}`;
      } else if (lastPath.includes('Bundle')) {
        // 处理Bundle特殊情况
        if (lastPath.includes('entry') && !lastPath.includes('resource')) {
          newPath = `${lastPath}.resource.ofType(${type})`;
        } else {
          newPath = `${lastPath}.${path}`;
        }
      } else {
        newPath = `${lastPath}.${path}`;
      }
    }
    
    setBuiltPath(newPath);
    setSelectedPath(newPath);
  };

  // 重置路径构建器
  const resetPathBuilder = () => {
    setPathComponents([]);
    setBuiltPath('');
  };

  // 使用现有路径初始化构建器
  const initializePathBuilderWithPath = (path: string) => {
    if (!path) return;
    
    // 拆分路径到组件
    const parts = path.split('.');
    const newComponents: Array<{type: string, path: string}> = [];
    
    // 解析类型和路径
    let currentPath = '';
    parts.forEach((part, index) => {
      // 尝试提取资源类型
      const typeMatch = part.match(/ofType\(([A-Za-z]+)\)/);
      const refMatch = part.match(/resolve\(([A-Za-z]+)\)/);
      
      if (typeMatch) {
        const resourceType = typeMatch[1];
        currentPath = index === 0 ? part : `${currentPath}.${part}`;
        newComponents.push({ type: resourceType, path: currentPath });
      } else if (refMatch) {
        const resourceType = refMatch[1];
        currentPath = index === 0 ? part : `${currentPath}.${part}`;
        newComponents.push({ type: resourceType, path: currentPath });
      } else {
        // 普通路径部分
        currentPath = index === 0 ? part : `${currentPath}.${part}`;
        
        // 尝试从第一个部分判断资源类型
        if (index === 0 && availableResources.some(r => r.type === part)) {
          newComponents.push({ type: part, path: part });
        } else if (newComponents.length > 0) {
          // 更新最后一个组件的路径
          const lastComponent = newComponents[newComponents.length - 1];
          newComponents[newComponents.length - 1] = { 
            ...lastComponent, 
            path: currentPath 
          };
        }
      }
    });
    
    setPathComponents(newComponents);
    setBuiltPath(path);
  };

  // FHIR Path构建器对话框
  const renderFhirPathBuilder = () => {
    if (!showFhirPathBuilder) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[80vh] overflow-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">FHIR Path 构建器</h3>
            <button 
              onClick={() => setShowFhirPathBuilder(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                当前路径
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={builtPath}
                  onChange={(e) => {
                    setBuiltPath(e.target.value);
                    setSelectedPath(e.target.value);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={resetPathBuilder}
                  className="ml-2 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  清除
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                路径组件
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {pathComponents.map((component, index) => (
                  <div key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    <span className="mr-1 font-bold">{component.type}:</span>
                    <span>{component.path}</span>
                  </div>
                ))}
                {pathComponents.length === 0 && (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    尚未添加任何路径组件
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  添加资源类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableResources.map((resource) => (
                    <button
                      key={resource.type}
                      onClick={() => addPathComponent(resource.type, resource.type)}
                      className="px-2 py-1 text-sm rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                    >
                      {resource.type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  常用路径模板
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addPathComponent('Bundle', 'Bundle.entry[*]')}
                    className="px-2 py-1 text-sm rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
                  >
                    Bundle.entry[*]
                  </button>
                  <button
                    onClick={() => addPathComponent('Composition', 'section[*].entry[*].reference')}
                    className="px-2 py-1 text-sm rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
                  >
                    section[*].entry[*].reference
                  </button>
                  <button
                    onClick={() => addPathComponent('Ref', 'reference.resolve(MedicationRequest)')}
                    className="px-2 py-1 text-sm rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
                  >
                    reference.resolve(MedicationRequest)
                  </button>
                  <button
                    onClick={() => addPathComponent('Organization', 'organization.reference.resolve(Organization)')}
                    className="px-2 py-1 text-sm rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
                  >
                    organization.reference.resolve(Organization)
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                自定义路径片段
              </label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="例如：identifier[0].value 或 name[0].family"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget.value.trim();
                      if (input) {
                        addPathComponent('Custom', input);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    const value = input.value.trim();
                    if (value) {
                      addPathComponent('Custom', value);
                      input.value = '';
                    }
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                >
                  添加
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFhirPathBuilder(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-2"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setSelectedPath(builtPath);
                  setShowFhirPathBuilder(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                应用路径
              </button>
            </div>
          </div>
        </div>
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
              onClick={() => {
                if (selectedPath) {
                  initializePathBuilderWithPath(selectedPath);
                }
                setShowFhirPathBuilder(true);
              }}
              className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              title="打开高级FHIR Path构建器"
            >
              <i className="fas fa-tools mr-1"></i>
              高级
            </button>
            
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
      
      {renderFhirPathBuilder()}
    </div>
  );
};

export default MappingConfigPage; 