/**
 * Ace编辑器环境配置钩子
 * 用于处理Web和VSCode环境下的不同配置
 */

import { useEffect } from 'react';
// 使用命名导入或从索引文件导入
import * as ace from 'ace-builds';
import { isVSCodeEnvironment } from '../utils/environment';
import { getVSCodeAPI } from '../utils/vscode-api';
import loadVSCodeAceModules from '../utils/ace-vscode-modules';

// 声明全局ACE_RESOURCES_PATH变量
declare global {
  interface Window {
    ACE_RESOURCES_PATH?: string;
    VSCODE_EDITOR_ENV?: boolean;
  }
}

// 直接加载常用的Ace模块
const loadAceModules = () => {
  if (isVSCodeEnvironment()) {
    try {
      // 在VSCode环境中，使用我们的专用模块加载器
      loadVSCodeAceModules();
    } catch (error) {
      console.error('VSCode环境: 加载Ace模块失败', error);
    }
  }
};

/**
 * Ace编辑器环境配置钩子
 * 为不同环境自动配置Ace编辑器
 */
export const useAceEnvironment = (): void => {
  useEffect(() => {
    // 尝试从当前脚本路径推断basePath
    try {
      // 对于Web环境，使用webpack-resolver配置
      if (!isVSCodeEnvironment()) {
        console.log('Web环境: 使用webpack-resolver配置Ace');
        // webpack-resolver导入已经设置了basePath
        // 在这里我们可以做一些额外的配置
      }
      // VSCode环境需要特殊处理
      else {
        console.log('VSCode环境: 配置Ace Editor资源路径');
        window.VSCODE_EDITOR_ENV = true;

        // 检查是否有注入的资源路径
        if (window.ACE_RESOURCES_PATH) {
          console.log('使用注入的Ace资源路径:', window.ACE_RESOURCES_PATH);

          // 设置Ace资源基础路径
          ace.config.set('basePath', window.ACE_RESOURCES_PATH);
          ace.config.set('modePath', `${window.ACE_RESOURCES_PATH}/src-noconflict`);
          ace.config.set('themePath', `${window.ACE_RESOURCES_PATH}/src-noconflict`);
          ace.config.set('workerPath', `${window.ACE_RESOURCES_PATH}/src-noconflict`);
          
          // 加载基础模块
          loadAceModules();
        }
        // 如果没有注入的路径，尝试请求VSCode扩展获取路径
        else if (typeof window !== 'undefined' && getVSCodeAPI && typeof getVSCodeAPI === 'function') {
          const vscode = getVSCodeAPI();
          if (vscode) {
            console.log('VSCode环境: 请求Ace资源路径', vscode);
            // 请求Ace资源路径  
            vscode.postMessage({
              command: 'getResourcePath',
              path: 'ace-builds'
            });

            // 监听来自VSCode的消息
            const handleMessage = (event: MessageEvent) => {
              const message = event.data;

              // 处理资源路径响应
              if (message.command === 'resourcePath' &&
                message.originalPath === 'ace-builds') {
                console.log('收到Ace资源路径:', message.resourcePath);

                // 设置Ace资源基础路径
                ace.config.set('basePath', message.resourcePath);
                ace.config.set('modePath', `${message.resourcePath}/src-noconflict`);
                ace.config.set('themePath', `${message.resourcePath}/src-noconflict`);
                ace.config.set('workerPath', `${message.resourcePath}/src-noconflict`);
                
                // 资源路径设置完成后加载基础模块
                loadAceModules();
              }
            };

            window.addEventListener('message', handleMessage);

            // 清理监听器
            return () => {
              window.removeEventListener('message', handleMessage);
            };
          }
        }
      }
    } catch (error) {
      console.error('配置Ace Editor环境时出错:', error);
    }
  }, []);
};

export default useAceEnvironment; 