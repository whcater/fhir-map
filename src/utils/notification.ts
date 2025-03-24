/**
 * 通知服务适配器
 * 在不同环境中提供一致的通知功能
 */
import { isVSCodeEnvironment } from './environment';

// VS Code上下文API，延迟加载
let useVSCode: any = null;

// 通知类型
export type NotificationType = 'info' | 'warning' | 'error' | 'success';

/**
 * 加载VS Code上下文
 */
async function loadVSCodeContext() {
  if (isVSCodeEnvironment() && !useVSCode) {
    try {
      const module = await import('../../vscode-extension/src/webview/VSCodeContext.js');
      useVSCode = module.useVSCode;
    } catch (error) {
      console.error('加载VS Code上下文失败:', error);
    }
  }
}

// 初始化加载
loadVSCodeContext();

/**
 * 创建Web环境的通知元素
 */
function createWebNotification(message: string, type: NotificationType): void {
  // 检查是否已存在通知容器
  let container = document.getElementById('notification-container');
  
  // 如果不存在，创建一个
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  // 创建通知元素
  const notification = document.createElement('div');
  notification.style.backgroundColor = getBackgroundColor(type);
  notification.style.color = '#ffffff';
  notification.style.padding = '12px 16px';
  notification.style.marginBottom = '10px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  notification.style.transition = 'all 0.3s ease';
  notification.style.transform = 'translateX(100%)';
  notification.style.opacity = '0';
  notification.textContent = message;
  
  // 添加到容器
  container.appendChild(notification);
  
  // 触发重排，然后显示
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 10);
  
  // 自动关闭
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    // 移除元素
    setTimeout(() => {
      container?.removeChild(notification);
      
      // 如果容器为空，移除容器
      if (container && container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    }, 300);
  }, 5000);
}

/**
 * 获取通知背景色
 */
function getBackgroundColor(type: NotificationType): string {
  switch (type) {
    case 'info':
      return '#0078d4';
    case 'warning':
      return '#f2c811';
    case 'error':
      return '#e74c3c';
    case 'success':
      return '#27ae60';
    default:
      return '#0078d4';
  }
}

/**
 * 显示消息通知
 * @param message 通知消息
 * @param type 通知类型
 */
export async function showNotification(message: string, type: NotificationType = 'info'): Promise<void> {
  if (isVSCodeEnvironment()) {
    // 确保VS Code上下文已加载
    if (!useVSCode) {
      await loadVSCodeContext();
    }
    
    if (useVSCode) {
      const vscode = useVSCode();
      
      // 根据类型调用不同的VS Code通知函数
      switch (type) {
        case 'info':
          vscode.showInformationMessage(message);
          break;
        case 'warning':
          vscode.showWarningMessage(message);
          break;
        case 'error':
          vscode.showErrorMessage(message);
          break;
        case 'success':
          vscode.showInformationMessage(message); // VS Code没有success类型，使用info代替
          break;
      }
    } else {
      // 降级到控制台
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  } else {
    // Web环境：创建自定义通知
    createWebNotification(message, type);
  }
}

// 导出便捷函数
export const showInfo = (message: string) => showNotification(message, 'info');
export const showWarning = (message: string) => showNotification(message, 'warning');
export const showError = (message: string) => showNotification(message, 'error');
export const showSuccess = (message: string) => showNotification(message, 'success'); 