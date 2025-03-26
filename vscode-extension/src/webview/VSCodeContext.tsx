/**
 * VS Code上下文提供者
 * 为React应用提供VS Code环境上下文，包括主题、状态管理等
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { vscodeApi } from './VSCodeBridge.js';

// 尝试使用自定义事件从主应用获取消息
// 如果vscodeApi为空，我们仍然需要监听事件以获取主题等信息
if (!vscodeApi) {
  console.warn('VSCodeContext: vscodeApi为空，将依赖其他模块的API实例');
}

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'high-contrast';

/**
 * VS Code消息payload类型
 */
interface ThemeChangedPayload {
  theme: Theme;
}

/**
 * VS Code上下文类型定义
 */
export interface VSCodeContextType {
  /** 向VS Code扩展发送消息 */
  postMessage: (command: string, payload?: any) => void;
  /** 当前VS Code主题 */
  theme: Theme;
  /** 获取VS Code状态 */
  getState: <T = any>() => T | undefined;
  /** 设置VS Code状态 */
  setState: (state: any) => void;
  /** 显示信息通知 */
  showInformationMessage: (message: string) => void;
  /** 显示警告通知 */
  showWarningMessage: (message: string) => void;
  /** 显示错误通知 */
  showErrorMessage: (message: string) => void;
  /** 注册消息监听器 */
  onMessage: (callback: (message: any) => void) => () => void;
}

// 默认上下文值
const defaultContext: VSCodeContextType = {
  postMessage: () => {},
  theme: 'light',
  getState: () => undefined,
  setState: () => {},
  showInformationMessage: () => {},
  showWarningMessage: () => {},
  showErrorMessage: () => {},
  onMessage: () => () => {},
};

// 创建上下文
const VSCodeContext = createContext<VSCodeContextType>(defaultContext);

// 自定义事件用于处理VSCode API为空的情况
export const postVSCodeMessageFallback = (command: string, payload?: any): boolean => {
  try {
    // 尝试通过window.postMessage向VSCode发送消息
    // 这种方式可能被主应用的消息处理器捕获
    window.postMessage({ command, payload }, '*');
    return true;
  } catch (error) {
    console.error('发送消息到VS Code失败(fallback):', error);
    return false;
  }
};

/**
 * VS Code上下文提供者组件
 */
export const VSCodeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // 状态
  const [theme, setTheme] = useState<Theme>('light');
  const [messageListeners] = useState<Set<(message: any) => void>>(new Set());
  
  // 发送消息到VS Code扩展
  const postMessage = useCallback((command: string, payload?: any) => {
    if (vscodeApi) {
      vscodeApi.postMessage({ command, payload });
    } else {
      // 使用替代方案发送消息
      postVSCodeMessageFallback(command, payload);
    }
  }, []);
  
  // 获取状态
  const getState = useCallback(<T = any>(): T | undefined => {
    return vscodeApi ? vscodeApi.getState<T>() : undefined;
  }, []);
  
  // 设置状态
  const setState = useCallback((state: any) => {
    if (vscodeApi) {
      vscodeApi.setState(state);
    }
  }, []);
  
  // 显示信息通知
  const showInformationMessage = useCallback((message: string) => {
    postMessage('showInformationMessage', { text: message });
  }, [postMessage]);
  
  // 显示警告通知
  const showWarningMessage = useCallback((message: string) => {
    postMessage('showWarningMessage', { text: message });
  }, [postMessage]);
  
  // 显示错误通知
  const showErrorMessage = useCallback((message: string) => {
    postMessage('showErrorMessage', { text: message });
  }, [postMessage]);
  
  // 消息处理
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const message = event.data;
      // 如果是主题变更消息，更新主题
      if (message && message.command === 'themeChanged') {
        if (message.theme) {
          setTheme(message.theme);
        }
      }
      
      // 通知所有注册的监听器
      messageListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('执行消息监听器时出错:', error);
        }
      });
    };
    
    window.addEventListener('message', handleWindowMessage);
    
    // 请求当前主题
    postMessage('getTheme');
    
    // 清理函数
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [postMessage, messageListeners]);
  
  // 注册消息监听器
  const onMessage = useCallback((callback: (message: any) => void): (() => void) => {
    messageListeners.add(callback);
    
    // 返回取消注册的函数
    return () => {
      messageListeners.delete(callback);
    };
  }, [messageListeners]);
  
  // 提供的上下文值
  const contextValue: VSCodeContextType = {
    postMessage,
    theme,
    getState,
    setState,
    showInformationMessage,
    showWarningMessage,
    showErrorMessage,
    onMessage,
  };
  
  return (
    <VSCodeContext.Provider value={contextValue}>
      {children}
    </VSCodeContext.Provider>
  );
};

/**
 * 使用VS Code上下文的钩子
 * @returns VS Code上下文对象
 */
export const useVSCode = () => useContext(VSCodeContext); 