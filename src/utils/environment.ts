/**
 * 环境检测工具
 * 用于区分VS Code和Web环境，帮助应用根据运行环境调整行为
 */

// 声明全局acquireVsCodeApi函数类型
declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
};

/**
 * 检测当前是否运行在VS Code环境中
 * @returns {boolean} 如果在VS Code环境中返回true，否则返回false
 */
export function isVSCodeEnvironment(): boolean {
  return typeof acquireVsCodeApi !== 'undefined';
}

/**
 * 获取当前运行环境名称
 * @returns {'vscode' | 'web'} 环境名称
 */
export function getEnvironment(): 'vscode' | 'web' {
  return isVSCodeEnvironment() ? 'vscode' : 'web';
}

/**
 * 检测是否处于开发模式
 * @returns {boolean} 如果在开发模式中返回true，否则返回false
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 获取当前运行平台
 * @returns {'desktop' | 'web' | 'unknown'} 平台类型
 */
export function getPlatform(): 'desktop' | 'web' | 'unknown' {
  // 在浏览器环境中
  if (typeof window !== 'undefined') {
    // 检测electron环境
    if (window.navigator.userAgent.includes('Electron')) {
      return 'desktop';
    }
    return 'web';
  }
  return 'unknown';
}

/**
 * 获取环境描述信息，用于调试
 * @returns {object} 包含环境详细信息的对象
 */
export function getEnvironmentInfo() {
  return {
    isVSCode: isVSCodeEnvironment(),
    environment: getEnvironment(),
    isDevelopment: isDevelopmentMode(),
    platform: getPlatform(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
  };
} 