import { useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import { LogicDtoModel, FieldMetadata, FieldType } from '../types';

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
      return `classDiagram\n  class "${model.name}" {\n    (无字段)\n  }\n`;
    }
    
    // 构建类图定义
    let definition = `classDiagram\n`;
    
    // 添加主类
    definition += `  class "${model.name}" {\n`;
    
    // 根级字段
    const rootFields = model.fields.filter(field => !field.parentId);
    
    if (rootFields.length === 0) {
      definition += `    (无根级字段)\n`;
    } else {
      rootFields.forEach(field => {
        // 安全检查字段名称
        const fieldName = field.name ? field.name.replace(/"/g, '\\"') : '未命名字段';
        const requiredMark = field.isRequired ? '*' : '';
        definition += `    ${fieldName}${requiredMark}: ${formatFieldType(field.type)}\n`;
      });
    }
    
    definition += `  }\n`;
    
    // 处理对象和数组类型的字段
    const objectFields = model.fields.filter(field => 
      (field.type === FieldType.OBJECT || field.type === FieldType.ARRAY) && !field.parentId
    );
    
    objectFields.forEach(objField => {
      // 为每个对象/数组字段创建子类
      try {
        definition += createSubClassDefinition(objField, model.fields, model.name);
      } catch (subclassError) {
        console.error(`创建子类定义时出错 (${objField.name}):`, subclassError);
        // 添加错误注释而不是抛出异常
        definition += `  %% 创建子类 "${objField.name}" 时出错: ${subclassError instanceof Error ? subclassError.message : String(subclassError)}\n`;
      }
    });
    
    return definition;
  };
  
  // 递归创建子类的类图定义
  const createSubClassDefinition = (
    parentField: FieldMetadata, 
    allFields: FieldMetadata[], 
    parentClassName: string
  ): string => {
    // 确保字段名称安全有效
    const safeParentName = parentField.name ? parentField.name.replace(/"/g, '\\"') : '未命名字段';
    const className = `${parentClassName}_${safeParentName}`;
    let definition = `  class "${className}" {\n`;
    
    // 添加子字段
    const childFields = allFields.filter(field => field.parentId === parentField.id);
    
    if (childFields.length === 0) {
      definition += `    (无子字段)\n`;
    } else {
      childFields.forEach(field => {
        // 确保字段名称安全有效
        const fieldName = field.name ? field.name.replace(/"/g, '\\"') : '未命名字段';
        const requiredMark = field.isRequired ? '*' : '';
        definition += `    ${fieldName}${requiredMark}: ${formatFieldType(field.type)}\n`;
      });
    }
    
    definition += `  }\n`;
    
    // 添加关系连接
    if (parentField.type === FieldType.ARRAY) {
      definition += `  "${parentClassName}" "1" --o "*" "${className}" : ${safeParentName}\n`;
    } else {
      definition += `  "${parentClassName}" "1" --o "1" "${className}" : ${safeParentName}\n`;
    }
    
    // 递归处理子对象/数组字段
    const nestedObjectFields = childFields.filter(field => 
      field.type === FieldType.OBJECT || field.type === FieldType.ARRAY
    );
    
    nestedObjectFields.forEach(objField => {
      try {
        definition += createSubClassDefinition(objField, allFields, className);
      } catch (nestedError) {
        console.error(`创建嵌套子类定义时出错 (${objField.name}):`, nestedError);
        // 添加错误注释而不是抛出异常
        definition += `  %% 创建嵌套子类 "${objField.name}" 时出错: ${nestedError instanceof Error ? nestedError.message : String(nestedError)}\n`;
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
          errorMessage = Object.keys(error).map(key => `${key}: ${error[key]}`).join(', ');
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
        <h3 className="text-lg font-serif font-semibold mb-4">逻辑模型视觉图</h3>
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