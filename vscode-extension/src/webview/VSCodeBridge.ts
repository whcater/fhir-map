/**
 * VS Code API 桥接
 * 为应用提供与VS Code通信的统一接口，实现单例模式确保API实例唯一
 */

// 声明全局acquireVsCodeApi函数类型
declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
};

/**
 * VS Code Webview API映射到统一接口
 */
export interface VSCodeAPIInterface {
  /**
   * 向VS Code扩展发送消息
   * @param message 要发送的消息对象
   */
  postMessage(message: any): void;
  
  /**
   * 获取存储的状态
   * @returns 当前存储的状态
   */
  getState(): any;
  
  /**
   * 设置状态
   * @param state 要存储的状态对象
   */
  setState(state: any): void;
}

/**
 * VS Code API包装类，实现单例模式
 */
class VSCodeAPI implements VSCodeAPIInterface {
  private static instance: VSCodeAPI;
  private vscodeApi: any;

  /**
   * 私有构造函数，防止外部实例化
   */
  private constructor() {
    // 获取VS Code API实例
    try {
      this.vscodeApi = acquireVsCodeApi();
    } catch (err) {
      console.error('无法获取VS Code API:', err);
      // 创建一个模拟的实现用于开发环境
      this.vscodeApi = this.createMockVSCodeAPI();
      console.warn('使用模拟的VS Code API');
    }
  }

  /**
   * 获取VSCodeAPI实例，如果不存在则创建
   * @returns VSCodeAPI单例实例
   */
  public static getInstance(): VSCodeAPI {
    if (!VSCodeAPI.instance) {
      VSCodeAPI.instance = new VSCodeAPI();
    }
    return VSCodeAPI.instance;
  }

  /**
   * 向VS Code扩展发送消息
   * @param message 要发送的消息对象
   */
  public postMessage(message: any): void {
    try {
      this.vscodeApi.postMessage(message);
    } catch (err) {
      console.error('发送消息到VS Code失败:', err, message);
    }
  }

  /**
   * 获取VS Code扩展存储的状态
   * @returns 当前存储的状态
   */
  public getState<T = any>(): T | undefined {
    try {
      return this.vscodeApi.getState();
    } catch (err) {
      console.error('获取VS Code状态失败:', err);
      return undefined;
    }
  }

  /**
   * 设置VS Code扩展的状态
   * @param state 要存储的状态对象
   */
  public setState(state: any): void {
    try {
      this.vscodeApi.setState(state);
    } catch (err) {
      console.error('设置VS Code状态失败:', err, state);
    }
  }

  /**
   * 创建一个模拟的VS Code API实现，用于开发环境
   * @returns 模拟的VS Code API对象
   */
  private createMockVSCodeAPI() {
    let state: any = {};
    return {
      postMessage: (message: any) => {
        console.log('模拟发送消息到VS Code:', message);
      },
      getState: () => {
        console.log('模拟获取VS Code状态');
        return state;
      },
      setState: (newState: any) => {
        console.log('模拟设置VS Code状态:', newState);
        state = { ...newState };
      }
    };
  }
}

/**
 * VS Code API实例
 * 通过此对象与VS Code扩展通信
 */
export const vscodeApi = VSCodeAPI.getInstance();

/**
 * 注册消息处理器
 * @param commandId 命令ID
 * @param handler 处理函数
 * @returns 用于取消注册的函数
 */
export function registerMessageHandler(
  commandId: string, 
  handler: (payload?: any) => void
): () => void {
  const eventListener = (event: MessageEvent) => {
    const message = event.data;
    if (message && message.command === commandId) {
      handler(message.payload);
    }
  };

  window.addEventListener('message', eventListener);
  
  // 返回取消注册的函数
  return () => {
    window.removeEventListener('message', eventListener);
  };
} 
