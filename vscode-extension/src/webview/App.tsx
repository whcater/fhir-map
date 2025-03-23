import React, { useState, useEffect, Component, ErrorInfo, useRef } from 'react';

// 错误边界组件
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', border: '1px solid red', borderRadius: '4px' }}>
          <h2>组件发生错误</h2>
          <p>{this.state.error?.message || '未知错误'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// 在组件外部获取 VSCode API 实例
let vscodeApiInstance: any = null;

try {
  // 尝试获取 VS Code API 实例（只获取一次）
  vscodeApiInstance = window.acquireVsCodeApi();
  console.log('VS Code API 实例已获取');
} catch (error) {
  console.error('获取 VS Code API 实例失败:', error);
}

const App: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);

  useEffect(() => {
    console.log('App 组件已挂载');
    
    if (!vscodeApiInstance) {
      setResponse('错误: 无法获取 VS Code API 实例');
      return;
    }
    
    // 监听来自 VS Code 的消息
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message && message.command === 'response') {
        setResponse(message.text);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // 清理函数
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 向 VS Code 扩展发送消息
  const sendMessage = () => {
    try {
      if (!vscodeApiInstance) {
        throw new Error('VS Code API 实例不可用');
      }
      
      vscodeApiInstance.postMessage({
        command: 'alert',
        text: message || '这是一个默认消息'
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      setResponse(`发送失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 显示 VS Code 通知
  const showNotification = () => {
    try {
      if (!vscodeApiInstance) {
        throw new Error('VS Code API 实例不可用');
      }
      
      vscodeApiInstance.postMessage({
        command: 'showInformationMessage',
        text: '这是一个通知消息'
      });
    } catch (error) {
      console.error('发送通知失败:', error);
      setResponse(`通知失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="app-container">
      <h1>FHIR 映射逻辑模型设计器</h1>
      <p>这是一个基本的 React 应用，用于演示与 VS Code 的通信。</p>
      
      <div className="form-group">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入要发送的消息"
          className="input"
        />
        <div className="button-group">
          <button onClick={sendMessage} className="button">
            发送消息到 VS Code
          </button>
          <button onClick={showNotification} className="button">
            显示 VS Code 通知
          </button>
        </div>
      </div>

      {response && (
        <div className="response">
          <h3>收到的响应:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

// 导出包含错误边界的 App
export default () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
); 
