import { useRef, useEffect, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { LogicDtoModel, FieldMetadata, FieldType } from '../types';
import { isVSCodeEnvironment } from '../utils/environment';
import { useFullscreen } from '../hooks/useFullscreen';

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
  const mermaidRef = useRef<HTMLDivElement | null>(null);
  const graphId = `graph-${model.id}`;
  const [scale, setScale] = useState(100); // 缩放比例，默认100%
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // 使用全屏Hook
  const { isFullscreen, toggleFullscreen } = useFullscreen(
    containerRef as React.RefObject<HTMLElement>,
    { 
      theme,
      enableKeyboardShortcuts: true,
      onFullscreenChange: (fullscreen) => {
        console.log('全屏状态变化:', fullscreen);
        window.dispatchEvent(new Event('resize'));
      }
    }
  );

  // 保存渲染后的Mermaid DOM引用
  const saveMermaidRef = useCallback(() => {
    if (containerRef.current) {
      mermaidRef.current = containerRef.current.querySelector('.mermaid') as HTMLDivElement;
    }
  }, []);

  useEffect(() => {
    // 配置Mermaid
    try {
      mermaid.initialize({
        startOnLoad: true,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        er: {
          diagramPadding: 40, // 增加内边距
          layoutDirection: 'TB', // 从上到下的布局
          minEntityWidth: 100,
          minEntityHeight: 75,
          entityPadding: 15
        },
        flowchart: {
          diagramPadding: 40
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
          diagramPadding: 40
        }
      });

      // 使用setTimeout延迟渲染，确保DOM已准备好
      const timer = setTimeout(() => {
        if (containerRef.current) {
          renderGraph();
        }
      }, 100);
      
      return () => clearTimeout(timer);
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

  // 空格键和鼠标拖动功能
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true);
        // 防止空格滚动页面
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 鼠标拖动事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (spacePressed || e.button === 1) { // 按下空格键或鼠标中键
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
      
      // 应用变换
      if (mermaidRef.current) {
        mermaidRef.current.style.transform = `translate(${position.x + dx}px, ${position.y + dy}px) scale(${scale/100})`;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指触摸开始拖动
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    } else if (e.touches.length === 2) {
      // 双指缩放
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastTouchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // 防止页面滚动
    
    if (e.touches.length === 1 && isDragging) {
      // 单指移动
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setDragStart({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
      
      // 应用变换
      if (mermaidRef.current) {
        mermaidRef.current.style.transform = `translate(${position.x + dx}px, ${position.y + dy}px) scale(${scale/100})`;
      }
    } else if (e.touches.length === 2) {
      // 双指缩放
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (lastTouchDistance > 0) {
        const delta = currentDist - lastTouchDistance;
        const newScale = Math.min(Math.max(scale + delta * 0.2, 60), 200);
        setScale(newScale);
        
        // 应用变换
        if (mermaidRef.current) {
          mermaidRef.current.style.transform = `translate(${position.x}px, ${position.y}px) scale(${newScale/100})`;
        }
      }
      
      setLastTouchDistance(currentDist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(0);
  };

  // 双击切换全屏
  const handleDoubleClick = () => {
    toggleFullscreen();
  };

  // 确保全屏按钮双击也能触发退出
  const handleFullscreenButtonClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡，避免与容器的双击冲突
    e.stopPropagation();
    toggleFullscreen();
  };

  // 调整缩放比例
  const adjustScale = (increment: boolean) => {
    setScale(prevScale => {
      const newScale = increment 
        ? Math.min(prevScale + 20, 200) // 增加至最大200%
        : Math.max(prevScale - 20, 60);  // 减少至最小60%
      
      // 应用新的缩放比例
      if (mermaidRef.current) {
        mermaidRef.current.style.transform = `translate(${position.x}px, ${position.y}px) scale(${newScale/100})`;
      }
      
      return newScale;
    });
  };

  // 重置位置和缩放
  const resetView = () => {
    setPosition({ x: 0, y: 0 });
    setScale(100);
    
    if (mermaidRef.current) {
      mermaidRef.current.style.transform = 'translate(0px, 0px) scale(1)';
    }
  };

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
      
      // console.log("生成的Mermaid ER图定义:", diagram);
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
      containerRef.current.innerHTML = `<div class="mermaid" style="transform: translate(${position.x}px, ${position.y}px) scale(${scale/100}); transform-origin: top left;">${definition}</div>`;
      
      // 使用try-catch包装mermaid.run以捕获特定错误
      try {
        // 解析和渲染图表
        await mermaid.run();
        // 保存渲染后的引用
        saveMermaidRef();
      } catch (mermaidError) {
        console.error("Mermaid渲染错误:", mermaidError);
        
        // 显示错误信息
        containerRef.current.innerHTML = `
          <div class="bg-red-100 dark:bg-red-900 p-4 rounded-md text-red-800 dark:text-red-200">
            <p class="font-semibold mb-2">图表渲染失败</p>
            <pre class="text-xs overflow-auto max-h-32">${mermaidError instanceof Error ? mermaidError.message : String(mermaidError)}</pre>
          </div>
        `;
      }
    } catch (error) {
      console.error("渲染图表出错:", error);
    }
  };

  // 检测当前全屏状态并输出详细信息
  const debugFullscreenState = () => {
    console.log('==== 全屏状态调试信息 ====');
    console.log('isFullscreen 状态:', isFullscreen);
    console.log('当前主题:', theme);
    console.log('是否在VSCode环境中:', isVSCodeEnvironment());
    
    if (document.body) {
      console.log('文档类名:', document.body.className);
      console.log('是否有vscode-light类:', document.body.classList.contains('vscode-light'));
      console.log('是否有vscode-dark类:', document.body.classList.contains('vscode-dark'));
    }
    
    if (containerRef.current) {
      const element = containerRef.current;
      console.log('DOM元素类名:', element.className);
      console.log('包含fullscreen-enabled类?', element.classList.contains('fullscreen-enabled'));
      console.log('包含fullscreen-exit类?', element.classList.contains('fullscreen-exit'));
      console.log('包含dark类?', element.classList.contains('dark'));
      console.log('元素样式:', element.getAttribute('style'));
      
      // 获取实际计算样式
      const computedStyle = window.getComputedStyle(element);
      console.log('计算后的背景色:', computedStyle.backgroundColor);
      console.log('计算后的背景图像:', computedStyle.backgroundImage);
      
      // 检查VSCode CSS变量
      if (isVSCodeEnvironment()) {
        try {
          const vscodeBg = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background');
          console.log('VSCode编辑器背景色变量:', vscodeBg);
        } catch (e) {
          console.log('无法获取VSCode CSS变量');
        }
      }
      
      console.log('保存的原始样式:', element.getAttribute('data-original-styles'));
    } else {
      console.log('找不到容器元素');
    }
    
    console.log('document.fullscreenElement:', document.fullscreenElement);
    console.log('==== 调试信息结束 ====');
  };

  return (
    <div className="visual-model-graph">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${isFullscreen ? 'h-full' : 'overflow-auto'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-serif font-semibold">逻辑模型视觉图</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => adjustScale(false)}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="缩小图表"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-300">{scale}%</span>
            <button
              onClick={() => adjustScale(true)}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="放大图表"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="重置视图"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleFullscreenButtonClick}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title={isFullscreen ? "退出全屏" : "全屏显示"}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 0m-5 0l0 5M9 15l-5 5m0 0l5 0m-5 0l0 -5M15 9l5 -5m0 0l-5 0m5 0l0 5M15 15l5 5m0 0l-5 0m5 0l0 -5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            {isFullscreen && (
              <button
                onClick={debugFullscreenState}
                className="p-1 text-xs bg-purple-200 hover:bg-purple-300 dark:bg-purple-700 dark:hover:bg-purple-600 rounded"
                title="调试全屏状态"
              >
                调试
              </button>
            )}
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
          className={`w-full ${isFullscreen ? 'h-[calc(100%-40px)]' : 'overflow-x-auto'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: spacePressed ? 'grab' : 'default', touchAction: 'none' }}
        >
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        </div>
        {spacePressed && (
          <div className="fixed bottom-4 right-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-2 rounded shadow text-xs">
            按住鼠标拖动图表
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualModelGraph;