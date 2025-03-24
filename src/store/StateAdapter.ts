/**
 * 状态管理适配器
 * 提供统一的状态管理接口，适配Web和VS Code环境
 */
import { isVSCodeEnvironment } from '../utils/environment';

/**
 * 状态适配器接口
 */
export interface StateAdapter<T> {
  /**
   * 获取状态
   * @returns 当前状态
   */
  getState(): T | undefined;
  
  /**
   * 设置状态
   * @param state 新状态
   */
  setState(state: T): void;
  
  /**
   * 更新状态
   * @param updater 状态更新函数
   */
  updateState(updater: (state: T | undefined) => T): void;
  
  /**
   * 监听状态变化
   * @param listener 监听函数
   * @returns 取消监听的函数
   */
  subscribe(listener: (state: T | undefined) => void): () => void;
  
  /**
   * 重置状态
   * @param defaultState 可选的默认状态
   */
  resetState(defaultState?: T): void;
}

/**
 * Web环境状态适配器
 * 使用localStorage存储状态
 */
class WebStateAdapter<T> implements StateAdapter<T> {
  private key: string;
  private listeners: Array<(state: T | undefined) => void> = [];
  
  constructor(key: string) {
    this.key = `fhir-map-${key}`;
  }
  
  getState(): T | undefined {
    try {
      const storedState = localStorage.getItem(this.key);
      return storedState ? JSON.parse(storedState) : undefined;
    } catch (error) {
      console.error('从localStorage读取状态失败:', error);
      return undefined;
    }
  }
  
  setState(state: T): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
      this.notifyListeners(state);
    } catch (error) {
      console.error('保存状态到localStorage失败:', error);
    }
  }
  
  updateState(updater: (state: T | undefined) => T): void {
    const currentState = this.getState();
    const newState = updater(currentState);
    this.setState(newState);
  }
  
  subscribe(listener: (state: T | undefined) => void): () => void {
    this.listeners.push(listener);
    // 立即通知当前状态
    listener(this.getState());
    
    // 返回取消订阅函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  resetState(defaultState?: T): void {
    try {
      if (defaultState) {
        this.setState(defaultState);
      } else {
        localStorage.removeItem(this.key);
        this.notifyListeners(undefined);
      }
    } catch (error) {
      console.error('重置状态失败:', error);
    }
  }
  
  private notifyListeners(state: T | undefined): void {
    this.listeners.forEach(listener => listener(state));
  }
}

/**
 * VS Code环境状态适配器
 * 使用VS Code扩展状态API
 */
class VSCodeStateAdapter<T> implements StateAdapter<T> {
  private key: string;
  private listeners: Array<(state: T | undefined) => void> = [];
  private vscodeApi: any = null;
  
  constructor(key: string) {
    this.key = key;
    
    // 延迟加载VSCodeBridge
    this.loadVSCodeApi();
  }
  
  private async loadVSCodeApi() {
    try {
      // 动态导入VS Code桥接
      const module = await import('../../vscode-extension/src/webview/VSCodeContext.js');
      const { useVSCode } = module;
      
      if (typeof useVSCode === 'function') {
        this.vscodeApi = useVSCode();
      } else {
        throw new Error('VSCodeContext.useVSCode不是一个函数');
      }
    } catch (error) {
      console.error('加载VS Code API失败:', error);
    }
  }
  
  private getVSCodeState(): any {
    if (!this.vscodeApi) return undefined;
    
    const state = this.vscodeApi.getState() || {};
    return state[this.key];
  }
  
  private setVSCodeState(value: any): void {
    if (!this.vscodeApi) return;
    
    const state = this.vscodeApi.getState() || {};
    this.vscodeApi.setState({ ...state, [this.key]: value });
  }
  
  getState(): T | undefined {
    return this.getVSCodeState();
  }
  
  setState(state: T): void {
    this.setVSCodeState(state);
    this.notifyListeners(state);
  }
  
  updateState(updater: (state: T | undefined) => T): void {
    const currentState = this.getState();
    const newState = updater(currentState);
    this.setState(newState);
  }
  
  subscribe(listener: (state: T | undefined) => void): () => void {
    this.listeners.push(listener);
    // 立即通知当前状态
    listener(this.getState());
    
    // 返回取消订阅函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  resetState(defaultState?: T): void {
    if (defaultState) {
      this.setState(defaultState);
    } else {
      this.setVSCodeState(undefined);
      this.notifyListeners(undefined);
    }
  }
  
  private notifyListeners(state: T | undefined): void {
    this.listeners.forEach(listener => listener(state));
  }
}

/**
 * 创建适合当前环境的状态适配器
 * @param key 状态键名
 * @returns 状态适配器实例
 */
export function createStateAdapter<T>(key: string): StateAdapter<T> {
  return isVSCodeEnvironment() 
    ? new VSCodeStateAdapter<T>(key)
    : new WebStateAdapter<T>(key);
} 