import { useRef, useState, useEffect, useCallback } from 'react';
import { isVSCodeEnvironment } from '../utils/environment';

interface UseFullscreenOptions {
  theme?: 'light' | 'dark';
  enableKeyboardShortcuts?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function useFullscreen(targetRef: React.RefObject<HTMLElement>, options: UseFullscreenOptions = {}) {
  const { 
    theme = 'light', 
    enableKeyboardShortcuts = true,
    onFullscreenChange 
  } = options;
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // 添加全屏样式
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .fullscreen-enabled {
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
      
      .fullscreen-enabled.dark {
        background: var(--background-color-dark, #1e1e1e) !important;
      }
      
      /* VSCode特定样式 */
      .vscode-light .fullscreen-enabled {
        background: var(--vscode-editor-background, #ffffff) !important;
      }
      
      .vscode-dark .fullscreen-enabled {
        background: var(--vscode-editor-background, #1e1e1e) !important;
      }
      
      .vscode-high-contrast .fullscreen-enabled {
        background: var(--vscode-editor-background, #000000) !important;
      }
      
      .fullscreen-exit {
        transition: all 0.3s ease-in-out !important;
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    
    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
      }
    };
  }, []);

  // 强制退出全屏
  const forceExitFullscreen = useCallback((element: HTMLElement) => {
    console.log('强制退出全屏状态');
    
    element.classList.remove('fullscreen-enabled');
    element.classList.remove('fullscreen-exit');
    element.classList.remove('dark');
    
    element.removeAttribute('style');
    element.removeAttribute('data-original-styles');
    
    // 强制触发布局重新计算
    void element.offsetHeight;
    
    setIsFullscreen(false);
    
    // 触发resize事件
    window.dispatchEvent(new Event('resize'));
    
    if (onFullscreenChange) {
      onFullscreenChange(false);
    }
  }, [onFullscreenChange]);

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    const element = targetRef.current;
    if (!element) return;

    const isInVSCode = isVSCodeEnvironment();
    
    if (isInVSCode) {
      if (!isFullscreen) {
        // 进入伪全屏模式
        const computedStyle = window.getComputedStyle(element);
        
        // 保存原始样式
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
        
        element.setAttribute('data-original-styles', JSON.stringify(originalStyles));
        
        // 应用全屏样式
        element.classList.add('fullscreen-enabled');
        if (theme === 'dark') {
          element.classList.add('dark');
        }
        
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '0';
        element.style.right = '0';
        element.style.bottom = '0';
        element.style.zIndex = '9999';
        
        if (isVSCodeEnvironment()) {
          element.style.backgroundColor = 'var(--vscode-editor-background)';
        } else {
          element.style.background = theme === 'dark' ? '#1e1e1e' : '#ffffff';
        }
        
        element.style.width = '100vw';
        element.style.height = '100vh';
        element.style.overflow = 'hidden';
        
        setIsFullscreen(true);
        if (onFullscreenChange) {
          onFullscreenChange(true);
        }
      } else {
        // 退出全屏
        element.classList.add('fullscreen-exit');
        
        setTimeout(() => {
          element.classList.remove('fullscreen-enabled');
          element.classList.remove('fullscreen-exit');
          element.classList.remove('dark');
          
          const originalStylesStr = element.getAttribute('data-original-styles');
          if (originalStylesStr) {
            try {
              const originalStyles = JSON.parse(originalStylesStr);
              Object.keys(originalStyles).forEach(key => {
                element.style[key as any] = originalStyles[key];
              });
              element.removeAttribute('data-original-styles');
            } catch (error) {
              forceExitFullscreen(element);
            }
          } else {
            forceExitFullscreen(element);
          }
          
          setIsFullscreen(false);
          if (onFullscreenChange) {
            onFullscreenChange(false);
          }
          window.dispatchEvent(new Event('resize'));
        }, 300);
      }
    } else {
      // 浏览器环境使用原生API
      if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
          console.error(`全屏错误: ${err.message}`);
        });
        setIsFullscreen(true);
        if (onFullscreenChange) {
          onFullscreenChange(true);
        }
      } else {
        document.exitFullscreen().catch(err => {
          console.error(`退出全屏错误: ${err.message}`);
        });
        setIsFullscreen(false);
        if (onFullscreenChange) {
          onFullscreenChange(false);
        }
      }
    }
  }, [targetRef, isFullscreen, theme, forceExitFullscreen, onFullscreenChange]);

  // 监听主题变化
  useEffect(() => {
    if (isFullscreen && targetRef.current) {
      const element = targetRef.current;
      
      element.classList.remove('dark');
      
      if (theme === 'dark') {
        element.classList.add('dark');
        element.style.background = '#1e1e1e';
      } else {
        element.style.background = '#ffffff';
      }
      
      if (isVSCodeEnvironment()) {
        if (theme === 'dark') {
          element.style.backgroundColor = 'var(--vscode-editor-background, #1e1e1e)';
        } else {
          element.style.backgroundColor = 'var(--vscode-editor-background, #ffffff)';
        }
      }
    }
  }, [theme, isFullscreen, targetRef]);

  // 添加键盘快捷键
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, toggleFullscreen, enableKeyboardShortcuts]);

  // 组件卸载时清理全屏状态
  useEffect(() => {
    return () => {
      if (isFullscreen && targetRef.current) {
        forceExitFullscreen(targetRef.current);
        
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error('退出全屏错误:', err);
          });
        }
      }
    };
  }, [isFullscreen, targetRef, forceExitFullscreen]);

  return {
    isFullscreen,
    toggleFullscreen,
    exitFullscreen: isFullscreen ? () => toggleFullscreen() : undefined
  };
} 