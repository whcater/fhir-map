/**
 * 通用主题钩子
 * 用于在Web和VS Code环境中提供一致的主题功能
 */
import { useState, useEffect, useCallback } from 'react';
import { isVSCodeEnvironment } from '../utils/environment';
import { postVSCodeMessage } from '../utils/vscode-api';

// 主题类型
export type Theme = 'light' | 'dark' | 'high-contrast';

// VS Code上下文类型，与VSCodeContext.tsx中定义相匹配
interface VSCodeContextType {
  theme: Theme;
  // 其他属性...
}

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
  
  // 首次加载时，尝试从本地存储读取主题
  useEffect(() => {
    if (!isVSCodeEnvironment()) {
      const savedTheme = localStorage.getItem('app-theme') as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    }
  }, []);
  
  // 加载VS Code上下文
  useEffect(() => {
    // 由于在VSCode环境中动态导入VSCodeContext会导致React Hook错误，
    // 这里采用不同的方式处理
    let isMounted = true;
    
    if (isVSCodeEnvironment()) {
      // 采用替代方案：通过消息机制获取VSCode主题
      try {
        // 使用window.postMessage方法直接与VSCode通信
        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message && message.command === 'themeChanged' && message.theme && isMounted) {
            setThemeState(message.theme);
          }
        });
        
        // 请求主题信息，使用全局缓存的VSCode API实例
        postVSCodeMessage('getTheme');
      } catch (error) {
        console.error('VSCode主题获取失败:', error);
      }
    }
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, []);
  
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