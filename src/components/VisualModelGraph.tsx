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
        return 'String';
      case FieldType.NUMBER:
        return 'Number';
      case FieldType.BOOLEAN:
        return 'Boolean';
      case FieldType.DATE:
        return 'Date';
      case FieldType.DATETIME:
        return 'DateTime';
      case FieldType.OBJECT:
        return 'Object';
      case FieldType.ARRAY:
        return 'Array';
      default:
        return type;
    }
  };

  // 生成ER图定义（替代类图）
  const generateMermaidDefinition = (): string => {
    try {
      // 使用ER图而不是类图，ER图对语法要求更宽松
      let diagram = `erDiagram\n`;
      
      // 创建主实体
      const safeModelName = model.name.replace(/[^a-zA-Z0-9_]/g, '_');
      
      diagram += `    ${safeModelName} {\n`;
      
      // 添加字段
      if (!model.fields || model.fields.length === 0) {
        diagram += `        string none "无字段"\n`;
      } else {
        // 只处理根级字段
        const rootFields = model.fields.filter(f => !f.parentId);
        
        if (rootFields.length === 0) {
          diagram += `        string none "无根级字段"\n`;
        } else {
          rootFields.forEach(field => {
            const fieldName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
            const fieldType = formatFieldType(field.type).toLowerCase();
            const required = field.isRequired ? "必填" : "可选";
            diagram += `        ${fieldType} ${fieldName} "${required}"\n`;
          });
        }
      }
      
      diagram += `    }\n`;
      
      // 处理子实体
      const entities = new Map<string, FieldMetadata>();
      const relationships: string[] = [];
      
      // 递归构建实体和关系
      const processEntity = (
        field: FieldMetadata, 
        parentId: string | null = null, 
        parentEntityName: string = safeModelName
      ) => {
        // 只处理对象和数组类型
        if (field.type !== FieldType.OBJECT && field.type !== FieldType.ARRAY) {
          return;
        }
        
        // 创建实体名称
        const fieldName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
        const entityName = `${parentEntityName}_${fieldName}`;
        
        // 存储实体
        entities.set(entityName, field);
        
        // 创建关系
        const cardinality = field.type === FieldType.ARRAY ? "||--o{" : "||--o|";
        relationships.push(`    ${parentEntityName} ${cardinality} ${entityName} : "${field.name.substring(0, 15)}"`);
        
        // 递归处理子字段
        const childFields = model.fields.filter(f => f.parentId === field.id);
        childFields
          .filter(f => f.type === FieldType.OBJECT || f.type === FieldType.ARRAY)
          .forEach(childField => {
            processEntity(childField, field.id, entityName);
          });
      };
      
      // 处理所有根级对象和数组字段
      model.fields
        .filter(f => !f.parentId && (f.type === FieldType.OBJECT || f.type === FieldType.ARRAY))
        .forEach(field => {
          processEntity(field);
        });
      
      // 添加所有实体
      entities.forEach((field, entityName) => {
        diagram += `    ${entityName} {\n`;
        
        // 添加子字段
        const childFields = model.fields.filter(f => f.parentId === field.id);
        
        if (childFields.length === 0) {
          diagram += `        string none "无子字段"\n`;
        } else {
          childFields
            .filter(f => f.type !== FieldType.OBJECT && f.type !== FieldType.ARRAY)
            .forEach(childField => {
              const fieldName = childField.name.replace(/[^a-zA-Z0-9_]/g, '_');
              const fieldType = formatFieldType(childField.type).toLowerCase();
              const required = childField.isRequired ? "必填" : "可选";
              diagram += `        ${fieldType} ${fieldName} "${required}"\n`;
            });
        }
        
        diagram += `    }\n`;
      });
      
      // 添加所有关系
      relationships.forEach(rel => {
        diagram += rel + '\n';
      });
      
      console.log("生成的Mermaid ER图定义:", diagram);
      return diagram;
    } catch (error) {
      console.error("生成Mermaid定义出错:", error);
      return `erDiagram\n    Model { string error "生成图表错误" }\n`;
    }
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