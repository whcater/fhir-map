/**
 * VS Code API 服务包装类
 * 用于管理与 VS Code 扩展的通信
 */

// 定义消息处理器类型
type MessageHandler = (message: any) => void;

// 定义 VS Code API 类型
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

export class VSCodeApi {
  private readonly vscode: any;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();

  constructor() {
    // 获取 VS Code API
    this.vscode = window.acquireVsCodeApi();

    // 监听来自 VS Code 扩展的消息
    window.addEventListener('message', this.handleExtensionMessage);
  }

  /**
   * 处理来自 VS Code 扩展的消息
   */
  private handleExtensionMessage = (event: MessageEvent) => {
    const message = event.data;
    
    // 如果消息包含命令，则触发对应命令的处理器
    if (message && message.command) {
      const handlers = this.messageHandlers.get(message.command);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
    }
  };

  /**
   * 向 VS Code 扩展发送消息
   * @param message 要发送的消息对象，必须包含 command 属性
   */
  public postMessage(message: { command: string; [key: string]: any }): void {
    this.vscode.postMessage(message);
  }

  /**
   * 获取 VS Code 存储的状态
   */
  public getState(): any {
    return this.vscode.getState();
  }

  /**
   * 设置状态到 VS Code 的存储中
   * @param state 要存储的状态对象
   */
  public setState(state: any): void {
    this.vscode.setState(state);
  }

  /**
   * 添加消息监听器
   * @param command 命令名称
   * @param handler 消息处理函数
   */
  public onMessage(command: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(command)) {
      this.messageHandlers.set(command, []);
    }

    const handlers = this.messageHandlers.get(command)!;
    handlers.push(handler);

    // 返回一个函数，用于移除此监听器
    return () => {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * 显示 VS Code 信息通知
   * @param message 通知消息
   */
  public showInformationMessage(message: string): void {
    this.postMessage({
      command: 'showInformationMessage',
      text: message
    });
  }

  /**
   * 显示 VS Code 错误通知
   * @param message 错误消息
   */
  public showErrorMessage(message: string): void {
    this.postMessage({
      command: 'showErrorMessage',
      text: message
    });
  }
}

// 导出单例实例
const vscodeApi = new VSCodeApi();
export default vscodeApi; 
