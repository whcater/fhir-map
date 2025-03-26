/**
 * 通用主题钩子
 * 用于在Web和VS Code环境中提供一致的主题功能
 */
import { useState, useEffect, useCallback } from 'react';
import { isVSCodeEnvironment } from '../utils/environment';

// 主题类型
export type Theme = 'light' | 'dark' | 'high-contrast';

// VS Code上下文类型，与VSCodeContext.tsx中定义相匹配
interface VSCodeContextType {
  theme: Theme;
  // 其他属性...
}

// VS Code钩子引用
let VSCodeModule: any = null;

/**
 * 通用主题钩子
 * 在Web环境中使用媒体查询，在VS Code环境中使用VSCodeContext
 * @returns 当前主题和设置主题的函数
 */
export function useTheme(): {
  theme: Theme;
  setTheme: (newTheme: Theme) => void;
  isDarkTheme: boolean;
} {
  // 主题状态
  const [theme, setThemeState] = useState<Theme>('light');
  const [vsCodeContextLoaded, setVSCodeContextLoaded] = useState(false);
  
  // 首次加载时，尝试从本地存储读取主题
  useEffect(() => {
    if (!isVSCodeEnvironment()) {
      const savedTheme = localStorage.getItem('app-theme') as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    }
  }, []);
  
  // 加载VS Code上下文模块（只加载模块，不调用Hook）
  useEffect(() => {
    if (isVSCodeEnvironment() && !VSCodeModule) {
      // 动态导入VS Code上下文
      import('../../vscode-extension/src/webview/VSCodeContext.js')
        .then(module => {
          // 只存储模块引用，不调用Hook
          VSCodeModule = module;
          console.log('VSCodeModule', VSCodeModule);
          setVSCodeContextLoaded(true);
        })
        .catch(err => {
          console.error('加载VS Code上下文失败3:', err);
        });
    }
  }, []);
  
  // 使用加载的VS Code上下文（在模块加载完成后）
  useEffect(() => {
    if (isVSCodeEnvironment() && vsCodeContextLoaded && VSCodeModule) {
      try {
        // 正确地在React组件内部调用useVSCode Hook
        const vscodeContext = VSCodeModule.useVSCode();
        if (vscodeContext && vscodeContext.theme) {
          setThemeState(vscodeContext.theme);
        }
      } catch (error) {
        console.error('使用VS Code上下文获取主题失败:', error);
      }
    }
  }, [vsCodeContextLoaded]);
  
  // 监听系统主题变化（仅Web环境）
  useEffect(() => {
    if (!isVSCodeEnvironment()) {
      // 使用媒体查询监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // 初始设置
      if (!localStorage.getItem('app-theme')) {
        setThemeState(mediaQuery.matches ? 'dark' : 'light');
      }
      
      // 变化处理函数
      const handleChange = (e: MediaQueryListEvent) => {
        // 只有在没有手动设置主题时才跟随系统
        if (!localStorage.getItem('app-theme')) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      };
      
      // 添加监听
      mediaQuery.addEventListener('change', handleChange);
      
      // 清理函数
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);
  
  // 设置主题函数
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Web环境保存到本地存储
    if (!isVSCodeEnvironment()) {
      localStorage.setItem('app-theme', newTheme);
    }
    
    // 更新文档类名以反映主题
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
    document.documentElement.classList.add(`theme-${newTheme}`);
    
    // 在VS Code环境中可以不做任何处理，因为VS Code自己管理主题
  }, []);
  
  // 判断是否为深色主题
  const isDarkTheme = theme === 'dark' || theme === 'high-contrast';
  
  return { theme, setTheme, isDarkTheme };
}