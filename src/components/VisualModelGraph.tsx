import { useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import { LogicDtoModel, FieldMetadata, FieldType } from '../types';

// 为Window扩展类型定义
declare global {
  interface Window {
    resizeTimer?: NodeJS.Timeout;
  }
}

interface VisualModelGraphProps {
  model: LogicDtoModel;
  theme?: 'light' | 'dark';
}

export const VisualModelGraph: React.FC<VisualModelGraphProps> = ({ model, theme = 'light' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphId = `graph-${model.id}`;

  useEffect(() => {
    // 配置Mermaid
    try {
      mermaid.initialize({
        startOnLoad: true,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        er: {
          diagramPadding: 20
        },
        flowchart: {
          diagramPadding: 20
        },
        // 添加更多配置以处理可能的渲染问题
        logLevel: 'error',
        fontFamily: 'sans-serif',
        fontSize: 14,
        sequence: {
          diagramMarginX: 50,
          diagramMarginY: 10
        },
        class: {
          diagramPadding: 20
        }
      });

      if (containerRef.current) {
        renderGraph();
      }
    } catch (initError) {
      console.error('Mermaid初始化失败:', initError);
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="bg-red-100 dark:bg-red-900 p-4 rounded-md text-red-800 dark:text-red-200">
            <p class="font-semibold mb-2">Mermaid初始化失败</p>
            <pre class="text-xs overflow-auto max-h-32">${initError instanceof Error ? initError.message : String(initError)}</pre>
          </div>
        `;
      }
    }
  }, [model, theme]);

  // 监听窗口大小变化，重新渲染图表
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // 使用防抖动优化性能
        if (window.resizeTimer) {
          clearTimeout(window.resizeTimer);
        }
        window.resizeTimer = setTimeout(() => {
          renderGraph();
        }, 300);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.resizeTimer) {
        clearTimeout(window.resizeTimer);
      }
    };
  }, [model]);

  // 将字段类型转换为更易读的格式
  const formatFieldType = (type: FieldType): string => {
    switch (type) {
      case FieldType.STRING:
        return '文本';
      case FieldType.NUMBER:
        return '数值';
      case FieldType.BOOLEAN:
        return '布尔';
      case FieldType.DATE:
        return '日期';
      case FieldType.DATETIME:
        return '日期时间';
      case FieldType.OBJECT:
        return '对象';
      case FieldType.ARRAY:
        return '数组';
      default:
        return type;
    }
  };

  // 生成Mermaid类图定义
  const generateMermaidDefinition = (): string => {
    // 检查模型字段是否存在
    if (!model.fields || model.fields.length === 0) {
      const safeModelName = model.name.replace(/[^a-zA-Z0-9_]/g, '_');
      return `classDiagram
  class "${safeModelName}" {
    (无字段)
  }
`;
    }
    
    // 构建类图定义 - 确保使用多行字符串而不是拼接
    let definition = `classDiagram

`;
    
    // 安全处理模型名称
    const safeModelName = model.name.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // 添加主类
    definition += `  class "${safeModelName}" {
`;
    
    // 根级字段
    const rootFields = model.fields.filter(field => !field.parentId);
    
    if (rootFields.length === 0) {
      definition += `    (无根级字段)
`;
    } else {
      rootFields.forEach(field => {
        // 安全检查字段名称
        const fieldName = field.name ? field.name.replace(/["\s]/g, '_') : '未命名字段';
        const requiredMark = field.isRequired ? '*' : '';
        definition += `    ${fieldName}${requiredMark}: ${formatFieldType(field.type)}
`;
      });
    }
    
    definition += `  }
`;
    
    // 处理对象和数组类型的字段
    const objectFields = model.fields.filter(field => 
      (field.type === FieldType.OBJECT || field.type === FieldType.ARRAY) && !field.parentId
    );
    
    objectFields.forEach(objField => {
      // 为每个对象/数组字段创建子类
      try {
        definition += createSubClassDefinition(objField, model.fields, safeModelName);
      } catch (subclassError) {
        console.error(`创建子类定义时出错 (${objField.name}):`, subclassError);
        // 添加错误注释而不是抛出异常
        definition += `  %% 创建子类 "${objField.name}" 时出错: ${subclassError instanceof Error ? subclassError.message : String(subclassError)}
`;
      }
    });
    
    // 输出一下生成的定义，便于调试
    console.log("生成的Mermaid定义:", definition);
    
    return definition;
  };
  
  // 递归创建子类的类图定义
  const createSubClassDefinition = (
    parentField: FieldMetadata, 
    allFields: FieldMetadata[], 
    parentClassName: string
  ): string => {
    // 确保字段名称和类名安全有效
    const safeParentName = parentField.name ? parentField.name.replace(/["\s]/g, '_') : '未命名字段';
    
    // 确保类名不包含特殊字符
    const safeClassName = `${parentClassName}_${safeParentName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    let definition = `  class "${safeClassName}" {
`;
    
    // 添加子字段
    const childFields = allFields.filter(field => field.parentId === parentField.id);
    
    if (childFields.length === 0) {
      definition += `    (无子字段)
`;
    } else {
      childFields.forEach(field => {
        // 确保字段名称安全有效
        const fieldName = field.name ? field.name.replace(/["\s]/g, '_') : '未命名字段';
        const requiredMark = field.isRequired ? '*' : '';
        definition += `    ${fieldName}${requiredMark}: ${formatFieldType(field.type)}
`;
      });
    }
    
    definition += `  }
`;
    
    // 添加关系连接
    if (parentField.type === FieldType.ARRAY) {
      // 避免长字段名，可能导致图表变形
      const shortName = safeParentName.length > 15 ? safeParentName.substring(0, 15) + '...' : safeParentName;
      definition += `  "${parentClassName}" "1" --o "*" "${safeClassName}" : ${shortName}
`;
    } else {
      const shortName = safeParentName.length > 15 ? safeParentName.substring(0, 15) + '...' : safeParentName;
      definition += `  "${parentClassName}" "1" --o "1" "${safeClassName}" : ${shortName}
`;
    }
    
    // 递归处理子对象/数组字段
    const nestedObjectFields = childFields.filter(field => 
      field.type === FieldType.OBJECT || field.type === FieldType.ARRAY
    );
    
    nestedObjectFields.forEach(objField => {
      try {
        definition += createSubClassDefinition(objField, allFields, safeClassName);
      } catch (nestedError) {
        console.error(`创建嵌套子类定义时出错 (${objField.name}):`, nestedError);
        // 添加错误注释而不是抛出异常
        definition += `  %% 创建嵌套子类 "${objField.name}" 时出错: ${nestedError instanceof Error ? nestedError.message : String(nestedError)}
`;
      }
    });
    
    return definition;
  };

  // 渲染图表
  const renderGraph = async () => {
    if (!containerRef.current) return;
    
    try {
      const definition = generateMermaidDefinition();
      containerRef.current.innerHTML = `<div class="mermaid">${definition}</div>`;
      
      // 解析和渲染图表
      await mermaid.run();
    } catch (error) {
      console.error('渲染视觉模型图出错:', error);
      
      // 改进错误处理，提供更详细的错误信息
      let errorMessage = '未知错误';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error, null, 2);
        } catch {
          errorMessage = Object.keys(error).map(key => `${key}: ${(error as Record<string, unknown>)[key]}`).join(', ');
        }
      } else {
        errorMessage = String(error);
      }
      
      containerRef.current.innerHTML = `
        <div class="bg-red-100 dark:bg-red-900 p-4 rounded-md text-red-800 dark:text-red-200">
          <p class="font-semibold mb-2">渲染视觉模型图时出错</p>
          <pre class="text-xs overflow-auto max-h-32">${errorMessage}</pre>
        </div>
      `;
    }
  };

  return (
    <div className="visual-model-graph">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-serif font-semibold">逻辑模型视觉图</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (containerRef.current) {
                  const mermaidDiv = containerRef.current.querySelector('.mermaid');
                  if (mermaidDiv) {
                    mermaidDiv.classList.toggle('scale-90');
                    mermaidDiv.classList.toggle('scale-100');
                  }
                }
              }}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="缩放图表"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            <button
              onClick={() => renderGraph()}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="刷新图表"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div 
          ref={containerRef} 
          id={graphId}
          className="w-full overflow-x-auto"
        >
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualModelGraph; 