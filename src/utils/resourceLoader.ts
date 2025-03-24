/**
 * 资源加载适配器
 * 在不同环境中提供一致的资源访问方式
 */
import { isVSCodeEnvironment } from './environment';

// VS Code上下文API，延迟加载
let useVSCode: any = null;

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
 * 获取资源的完整路径
 * 
 * @param path 资源相对路径
 * @returns 资源的完整路径
 */
export async function getResourcePath(path: string): Promise<string> {
  // 确保VS Code上下文已加载
  if (isVSCodeEnvironment() && !useVSCode) {
    await loadVSCodeContext();
  }
  
  // VS Code环境：通过消息通信获取资源URI
  if (isVSCodeEnvironment() && useVSCode) {
    try {
      const vscode = useVSCode();
      
      // 创建一个Promise，等待资源路径的响应
      return new Promise<string>((resolve) => {
        // 注册一次性监听器，接收资源路径响应
        const unsubscribe = vscode.onMessage((message: any) => {
          if (message.command === 'resourcePath' && message.resourcePath && message.originalPath === path) {
            unsubscribe(); // 移除监听器
            resolve(message.resourcePath);
          }
        });
        
        // 请求资源路径
        vscode.postMessage('getResourcePath', { path });
        
        // 5秒超时，防止无限等待
        setTimeout(() => {
          unsubscribe();
          console.warn(`获取资源路径超时: ${path}`);
          resolve(path); // 降级到原始路径
        }, 5000);
      });
    } catch (error) {
      console.error('获取VS Code资源路径失败:', error);
      return path; // 降级到原始路径
    }
  }
  
  // Web环境：直接返回相对路径或构建绝对路径
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path; // 已经是绝对路径
  }
  
  // 对于相对路径，在开发环境中可能需要调整
  if (import.meta.env.DEV) {
    // 开发环境中，可能需要加上基础路径
    return new URL(path, import.meta.url).href;
  }
  
  // 生产环境中的路径处理
  return `${import.meta.env.BASE_URL || '/'}${path}`;
}

/**
 * 适配图片路径
 * 
 * @param imagePath 图片相对路径
 * @returns Promise<string> 图片的完整路径
 */
export const getImagePath = (imagePath: string): Promise<string> => getResourcePath(`images/${imagePath}`);

/**
 * 创建资源加载函数
 * 
 * @param basePath 资源基础路径
 * @returns 资源加载函数
 */
export function createResourceLoader(basePath: string): (path: string) => Promise<string> {
  return (path: string) => getResourcePath(`${basePath}/${path}`);
} 