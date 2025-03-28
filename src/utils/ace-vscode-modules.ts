/**
 * VSCode环境专用的Ace模块加载器
 * 使用静态导入和手动注册方式来代替动态导入
 */

import * as ace from 'ace-builds';
import { isVSCodeEnvironment } from './environment';

// 手动加载VSCode环境中需要的Ace模块
export const loadVSCodeAceModules = (): void => {
  // 只在VSCode环境中执行
  if (!isVSCodeEnvironment()) {
    return;
  }

  console.log('VSCode环境: 加载ACE模块');

  try {
    // 这里不使用动态导入，而是依赖VSCode扩展中的资源
    // VSCode扩展会通过WebviewPanel的resourceRoot选项提供这些文件
    
    // 设置主题和模式
    ace.config.loadModule('ace/theme/github', () => {});
    ace.config.loadModule('ace/theme/monokai', () => {});
    ace.config.loadModule('ace/mode/json', () => {});
    ace.config.loadModule('ace/ext/language_tools', () => {});
    
    console.log('VSCode环境: ACE模块加载完成');
  } catch (error) {
    console.error('VSCode环境: 加载ACE模块失败', error);
  }
};

export default loadVSCodeAceModules;