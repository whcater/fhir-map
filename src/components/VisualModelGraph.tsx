import { useRef, useEffect, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { LogicDtoModel, FieldMetadata, FieldType } from '../types';
import { isVSCodeEnvironment } from '../utils/environment';
import { postVSCodeMessage } from '../utils/vscode-api';

// 为Window扩展类型定义
declare global {
  interface Window {
    resizeTimer?: NodeJS.Timeout;
  }
}

// 声明VSCode API相关类型
declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
  getState<T = any>(): T;
  setState(state: any): void;
};

interface VisualModelGraphProps {
  model: LogicDtoModel;
  theme?: 'light' | 'dark';
}

export const VisualModelGraph: React.FC<VisualModelGraphProps> = ({ model, theme = 'light' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement | null>(null);
  const graphId = `graph-${model.id}`;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(100); // 缩放比例，默认100%
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // 退出全屏时进行更彻底的清理
  const forceExitFullscreen = (parentElement: HTMLElement) => {
    console.log('强制退出全屏状态');
    
    // 移除所有相关的类
    parentElement.classList.remove('pseudo-fullscreen');
    parentElement.classList.remove('pseudo-fullscreen-exit');
    parentElement.classList.remove('dark');
    
    // 完全清除内联样式
    parentElement.removeAttribute('style');
    
    // 移除数据属性
    parentElement.removeAttribute('data-original-styles');
    
    // 强制触发布局重新计算
    void parentElement.offsetHeight;
    
    // 重新应用正确的主题类名
    if (theme === 'dark') {
      parentElement.classList.add('dark:bg-gray-800');
    } else {
      parentElement.classList.add('bg-white');
    }
    
    // 更新组件状态
    setIsFullscreen(false);
    
    // 触发resize事件
    window.dispatchEvent(new Event('resize'));
    
    console.log('全屏模式已完全重置');
  };

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

  // 全屏功能
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  // 切换全屏
  const toggleFullscreen = () => {
    // 检查是否在VSCode环境中运行
    const isInVSCode = isVSCodeEnvironment();
    
    if (isInVSCode) {
      // 在VSCode中实现自定义伪全屏
      console.log('在VSCode环境中切换全屏模式');
      console.log('当前全屏状态:', isFullscreen);
      
      if (containerRef.current?.parentElement) {
        const parentElement = containerRef.current.parentElement;
        
        if (!isFullscreen) {
          // 进入伪全屏模式
          console.log('进入伪全屏模式');
          
          // 使用getComputedStyle获取计算后的样式，而不是直接读取style属性
          const computedStyle = window.getComputedStyle(parentElement);
          
          // 保存原始样式以便还原
          const originalStyles = {
            position: computedStyle.position,
            top: computedStyle.top,
            left: computedStyle.left,
            right: computedStyle.right,
            bottom: computedStyle.bottom,
            zIndex: computedStyle.zIndex,
            background: computedStyle.background,
            width: computedStyle.width,
            height: computedStyle.height,
            overflow: computedStyle.overflow
          };
          
          console.log('保存的原始样式(计算后):', originalStyles);
          
          // 将原始样式保存为数据属性
          parentElement.setAttribute('data-original-styles', JSON.stringify(originalStyles));
          
          // 应用伪全屏样式
          parentElement.classList.add('pseudo-fullscreen');
          if (theme === 'dark') {
            parentElement.classList.add('dark');
          }
          parentElement.style.position = 'fixed';
          parentElement.style.top = '0';
          parentElement.style.left = '0';
          parentElement.style.right = '0';
          parentElement.style.bottom = '0';
          parentElement.style.zIndex = '9999';
          
          // 使用VSCode变量设置背景色
          if (isVSCodeEnvironment()) {
            parentElement.style.backgroundColor = 'var(--vscode-editor-background)';
          } else {
            parentElement.style.background = theme === 'dark' ? '#1e1e1e' : '#ffffff';
          }
          
          parentElement.style.width = '100vw';
          parentElement.style.height = '100vh';
          parentElement.style.overflow = 'hidden';
          
          setIsFullscreen(true);
        } else {
          // 退出伪全屏
          console.log('退出伪全屏模式');
          
          try {
            // 添加退出动画类
            parentElement.classList.add('pseudo-fullscreen-exit');
            
            // 无论是否有pseudo-fullscreen类，都尝试执行退出全屏的逻辑
            setTimeout(() => {
              // 移除类名
              parentElement.classList.remove('pseudo-fullscreen');
              parentElement.classList.remove('pseudo-fullscreen-exit');
              parentElement.classList.remove('dark');
              
              // 从数据属性中获取并恢复原始样式
              const originalStylesStr = parentElement.getAttribute('data-original-styles');
              console.log('获取到的原始样式字符串:', originalStylesStr);
              
              if (originalStylesStr) {
                try {
                  const originalStyles = JSON.parse(originalStylesStr);
                  console.log('解析的原始样式对象:', originalStyles);
                  
                  // 应用原始样式
                  Object.keys(originalStyles).forEach(key => {
                    parentElement.style[key as any] = originalStyles[key];
                  });
                  
                  // 清除数据属性
                  parentElement.removeAttribute('data-original-styles');
                } catch (parseError) {
                  console.error('解析原始样式JSON出错:', parseError);
                  forceExitFullscreen(parentElement);
                }
              } else {
                console.error('未找到原始样式数据');
                // 应用默认样式
                forceExitFullscreen(parentElement);
              }
              
              setIsFullscreen(false);
              
              // 触发resize事件以确保图形正确渲染
              window.dispatchEvent(new Event('resize'));
            }, 500); // 增加到500ms以确保有足够时间完成过渡
          } catch (error) {
            console.error('退出全屏时发生错误:', error);
            // 强制重置样式
            forceExitFullscreen(parentElement);
          }
        }
      }
    } else {
      // 浏览器环境中使用原生全屏API
      if (!document.fullscreenElement) {
        // 进入全屏
        if (containerRef.current?.parentElement) {
          containerRef.current.parentElement.requestFullscreen().catch(err => {
            console.error(`全屏错误: ${err.message}`);
          });
          setIsFullscreen(true);
        }
      } else {
        // 退出全屏
        document.exitFullscreen().catch(err => {
          console.error(`退出全屏错误: ${err.message}`);
        });
        setIsFullscreen(false);
      }
    }
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
        console.error('Mermaid渲染错误，尝试重试:', mermaidError);
        
        // 如果是"Could not find a suitable point"错误，等待一会儿再尝试渲染一次
        if (mermaidError instanceof Error && 
            mermaidError.message.includes('Could not find a suitable point')) {
          setTimeout(async () => {
            try {
              await mermaid.run();
              // 保存渲染后的引用
              saveMermaidRef();
            } catch (retryError) {
              // 重试失败，显示错误信息
              displayError(retryError);
            }
          }, 200);
        } else {
          // 其他错误直接显示
          displayError(mermaidError);
        }
      }
    } catch (error) {
      displayError(error);
    }
  };
  
  // 显示错误信息的辅助函数
  const displayError = (error: unknown) => {
    if (!containerRef.current) return;
    
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
  };

  useEffect(() => {
    // 添加伪全屏样式
    const style = document.createElement('style');
    style.innerHTML = `
      .pseudo-fullscreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 9999 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: var(--background-color, #ffffff) !important;
        overflow: hidden !important;
        transition: all 0.3s ease-in-out !important;
      }
      
      .pseudo-fullscreen.dark {
        background: var(--background-color-dark, #1e1e1e) !important;
      }
      
      /* VSCode特定样式 */
      .vscode-light .pseudo-fullscreen {
        background: var(--vscode-editor-background, #ffffff) !important;
      }
      
      .vscode-dark .pseudo-fullscreen {
        background: var(--vscode-editor-background, #1e1e1e) !important;
      }
      
      .vscode-high-contrast .pseudo-fullscreen {
        background: var(--vscode-editor-background, #000000) !important;
      }
      
      .pseudo-fullscreen .visual-model-container {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
      }
      
      .pseudo-fullscreen-exit {
        transition: all 0.3s ease-in-out !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // 清理
      document.head.removeChild(style);
    };
  }, []);

  // 添加全屏状态变化监听
  useEffect(() => {
    // 在全屏状态变化时触发UI更新
    console.log('全屏状态变化:', isFullscreen);
    
    // 在全屏状态变化后触发窗口大小调整事件
    if (containerRef.current) {
      window.dispatchEvent(new Event('resize'));
    }
    
    // 关联文档标题以指示全屏状态
    const originalTitle = document.title;
    if (isFullscreen) {
      document.title = `${originalTitle} [全屏模式]`;
    }
    
    return () => {
      // 恢复原始标题
      document.title = originalTitle;
    };
  }, [isFullscreen]);

  // 添加键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F11键或ESC键控制全屏
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
      
      // 放大/缩小快捷键
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          adjustScale(true);
        } else if (e.key === '-') {
          e.preventDefault();
          adjustScale(false);
        } else if (e.key === '0') {
          e.preventDefault();
          resetView();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, toggleFullscreen, adjustScale, resetView]);

  // 确保组件卸载时清理全屏状态
  useEffect(() => {
    return () => {
      // 如果组件在全屏状态下卸载，尝试恢复正常状态
      if (isFullscreen) {
        try {
          const parentElement = containerRef.current?.parentElement;
          if (parentElement && parentElement.classList.contains('pseudo-fullscreen')) {
            forceExitFullscreen(parentElement);
          }
          
          // 如果使用的是原生全屏API，尝试退出
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
              console.error('退出全屏错误:', err);
            });
          }
        } catch (error) {
          console.error('组件卸载时清理全屏状态出错:', error);
        }
      }
    };
  }, [isFullscreen]);

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
    
    if (containerRef.current?.parentElement) {
      const parentElement = containerRef.current.parentElement;
      console.log('DOM元素类名:', parentElement.className);
      console.log('包含pseudo-fullscreen类?', parentElement.classList.contains('pseudo-fullscreen'));
      console.log('包含pseudo-fullscreen-exit类?', parentElement.classList.contains('pseudo-fullscreen-exit'));
      console.log('包含dark类?', parentElement.classList.contains('dark'));
      console.log('元素样式:', parentElement.getAttribute('style'));
      
      // 获取实际计算样式
      const computedStyle = window.getComputedStyle(parentElement);
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
      
      console.log('保存的原始样式:', parentElement.getAttribute('data-original-styles'));
      
      // 检测状态一致性
      const hasFullscreenStyles = (
        parentElement.style.position === 'fixed' && 
        parentElement.style.zIndex === '9999'
      );
      
      console.log('DOM状态显示为全屏?', hasFullscreenStyles);
      console.log('状态是否一致?', isFullscreen === hasFullscreenStyles);
      console.log('主题是否正确应用?', 
        (theme === 'dark' && (parentElement.classList.contains('dark') || computedStyle.backgroundColor.includes('33, 33'))) || 
        (theme === 'light' && (!parentElement.classList.contains('dark') || computedStyle.backgroundColor.includes('255, 255')))
      );
      
      if (isFullscreen !== hasFullscreenStyles) {
        console.warn('全屏状态与DOM不一致!');
      }
      
      if (isFullscreen && theme === 'dark' && !parentElement.classList.contains('dark')) {
        console.warn('暗色主题未正确应用!');
      }
    } else {
      console.log('找不到容器父元素');
    }
    
    console.log('document.fullscreenElement:', document.fullscreenElement);
    console.log('==== 调试信息结束 ====');
  };
  
  // 修复可能的全屏状态不一致
  const fixFullscreenState = () => {
    if (containerRef.current?.parentElement) {
      const parentElement = containerRef.current.parentElement;
      const hasFullscreenStyles = (
        parentElement.style.position === 'fixed' && 
        parentElement.style.zIndex === '9999'
      );
      
      if (isFullscreen && !hasFullscreenStyles) {
        // 状态显示应该全屏，但DOM不是全屏状态
        console.log('修复状态: 应为全屏但DOM不是全屏');
        toggleFullscreen();
      } else if (!isFullscreen && hasFullscreenStyles) {
        // 状态显示不应全屏，但DOM是全屏状态
        console.log('修复状态: 不应为全屏但DOM是全屏');
        forceExitFullscreen(parentElement);
      } else {
        console.log('全屏状态一致，无需修复');
      }
    }
  };
  
  // 模拟ESC键退出全屏
  const handleEscKeyExit = () => {
    console.log('模拟ESC键退出全屏');
    if (isFullscreen) {
      toggleFullscreen();
    }
  };

  // 监听主题变化
  useEffect(() => {
    if (isFullscreen && containerRef.current?.parentElement) {
      const parentElement = containerRef.current.parentElement;
      
      // 移除可能存在的主题类
      parentElement.classList.remove('dark');
      
      // 根据当前主题添加类名
      if (theme === 'dark') {
        parentElement.classList.add('dark');
        parentElement.style.background = '#1e1e1e';
      } else {
        parentElement.style.background = '#ffffff';
      }
      
      // 确保背景色立即生效
      parentElement.style.transition = 'background-color 0.3s ease-in-out';
      
      // 在VSCode中，可能需要额外处理
      if (isVSCodeEnvironment()) {
        // 尝试应用VSCode的主题颜色
        if (theme === 'dark') {
          parentElement.style.backgroundColor = 'var(--vscode-editor-background, #1e1e1e)';
        } else {
          parentElement.style.backgroundColor = 'var(--vscode-editor-background, #ffffff)';
        }
      }
    }
  }, [theme, isFullscreen]);

  return (
    <div className={`visual-model-graph ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
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
              onDoubleClick={handleFullscreenButtonClick}
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
              <>
                <button
                  onClick={handleEscKeyExit}
                  className="p-1 text-xs bg-red-200 hover:bg-red-300 dark:bg-red-700 dark:hover:bg-red-600 rounded"
                  title="退出全屏(ESC)"
                >
                  ESC
                </button>
                <button
                  onClick={() => {
                    if (containerRef.current?.parentElement) {
                      forceExitFullscreen(containerRef.current.parentElement);
                    }
                  }}
                  className="p-1 text-xs bg-orange-200 hover:bg-orange-300 dark:bg-orange-700 dark:hover:bg-orange-600 rounded"
                  title="强制退出全屏"
                >
                  强退
                </button>
                <button
                  onClick={debugFullscreenState}
                  className="p-1 text-xs bg-purple-200 hover:bg-purple-300 dark:bg-purple-700 dark:hover:bg-purple-600 rounded"
                  title="调试全屏状态"
                >
                  调试
                </button>
                <button
                  onClick={fixFullscreenState}
                  className="p-1 text-xs bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600 rounded"
                  title="修复全屏状态"
                >
                  修复
                </button>
              </>
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