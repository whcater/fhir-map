import React, { useState } from 'react';
import * as fhirpath from 'fhirpath';
import { showWarning, showSuccess } from '../../utils/notification';

interface FhirPathBuilderProps {
  initialPath: string;
  parsedJson: any;
  isOpen: boolean;
  onClose: () => void;
  onApplyPath: (path: string) => void;
  availableResources: Array<{type: string, example: string}>;
}

const FhirPathBuilder: React.FC<FhirPathBuilderProps> = ({
  initialPath,
  parsedJson,
  isOpen,
  onClose,
  onApplyPath,
  availableResources
}) => {
  const [builtPath, setBuiltPath] = useState<string>(initialPath || '');
  const [pathComponents, setPathComponents] = useState<Array<{type: string, path: string}>>([]);
  
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

  // 添加路径组件
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
  };

  // 使用FHIRPath库执行FHIRPath表达式
  const evaluateFhirPath = (expression: string, resource: any): any[] => {
    try {
      // 使用fhirpath库执行表达式
      const result = fhirpath.evaluate(resource, expression);
      // 确保返回数组
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error('FHIRPath执行错误:', error);
      return [];
    }
  };
  
  // 添加FHIRPath where函数支持
  const applyWhereFunction = (path: string, condition: string): string => {
    return `${path}.where(${condition})`;
  };
  
  // 添加FHIRPath select函数支持
  const applySelectFunction = (path: string, projection: string): string => {
    return `${path}.select(${projection})`;
  };
  
  // 添加资源类型过滤 - ofType函数支持
  const applyOfTypeFunction = (path: string, resourceType: string): string => {
    return `${path}.ofType(${resourceType})`;
  };

  // 测试执行FHIRPath表达式并返回结果
  const testFhirPathExpression = (path: string): any[] => {
    if (!parsedJson) return [];
    
    try {
      return evaluateFhirPath(path, parsedJson);
    } catch (error) {
      console.error('FHIRPath测试错误:', error);
      return [];
    }
  };
  
  // 在FHIRPath构建器中添加路径预览
  const renderPathPreview = (path: string): React.ReactNode => {
    const result = testFhirPathExpression(path);
    
    if (!result || result.length === 0) {
      return <div className="text-gray-500 italic">无结果</div>;
    }
    
    // 将结果格式化为字符串
    const formattedResult = result.map(item => {
      if (typeof item === 'object') {
        return JSON.stringify(item, null, 2);
      }
      return item.toString();
    }).join('\n');
    
    return (
      <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded-md max-h-[100px] overflow-auto">
        <pre>{formattedResult}</pre>
      </div>
    );
  };

  // 组件初始化
  React.useEffect(() => {
    if (initialPath && isOpen) {
      initializePathBuilderWithPath(initialPath);
    }
  }, [initialPath, isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">高级 FHIR Path 构建器</h3>
          <button 
            onClick={onClose}
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
            
            {/* 路径预览 */}
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">路径预览</div>
              {renderPathPreview(builtPath)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
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
              
              <div className="mb-4">
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
              
              <div className="mb-4">
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
            
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  高级FHIRPath函数
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const condition = prompt('请输入where条件 (例如: gender=\'male\')');
                      if (condition) {
                        setBuiltPath(applyWhereFunction(builtPath, condition));
                      }
                    }}
                    className="px-2 py-1 text-sm rounded-md bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800"
                  >
                    where()
                  </button>
                  <button
                    onClick={() => {
                      const projection = prompt('请输入select投影 (例如: name)');
                      if (projection) {
                        setBuiltPath(applySelectFunction(builtPath, projection));
                      }
                    }}
                    className="px-2 py-1 text-sm rounded-md bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800"
                  >
                    select()
                  </button>
                  <button
                    onClick={() => {
                      const resourceType = prompt('请输入资源类型 (例如: Patient)');
                      if (resourceType) {
                        setBuiltPath(applyOfTypeFunction(builtPath, resourceType));
                      }
                    }}
                    className="px-2 py-1 text-sm rounded-md bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800"
                  >
                    ofType()
                  </button>
                  <button
                    onClick={() => {
                      setBuiltPath(`${builtPath}.first()`);
                    }}
                    className="px-2 py-1 text-sm rounded-md bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800"
                  >
                    first()
                  </button>
                  <button
                    onClick={() => {
                      setBuiltPath(`${builtPath}.exists()`);
                    }}
                    className="px-2 py-1 text-sm rounded-md bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800"
                  >
                    exists()
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
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
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  测试FHIRPath
                </label>
                <button
                  onClick={() => {
                    const result = testFhirPathExpression(builtPath);
                    alert(`FHIRPath结果: ${JSON.stringify(result, null, 2)}`);
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full"
                >
                  测试当前路径
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-2"
            >
              取消
            </button>
            <button
              onClick={() => onApplyPath(builtPath)}
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

export default FhirPathBuilder; 