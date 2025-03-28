/**
 * ACE编辑器ESM兼容的资源解析器
 * 替代原始的webpack-resolver.js，解决ESM模式下的兼容性问题
 */

import * as ace from 'ace-builds';
import { isVSCodeEnvironment } from '../utils/environment';

// 动态导入所需的ACE模块
const importModule = async (path: string): Promise<any> => {
  try {
    // 只在Web环境下尝试导入模块
    if (!isVSCodeEnvironment()) {
      return await import(`ace-builds/src-noconflict/${path}.js`);
    }
    return null;
  } catch (error) {
    console.error(`无法加载ACE模块 ${path}:`, error);
    return null;
  }
};

// 根据环境设置不同的配置
if (!isVSCodeEnvironment()) {
  // 在Web环境中使用正常路径
  console.log('Web环境: 设置Ace编辑器Web资源路径');
  ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict');
  ace.config.set('modePath', '/node_modules/ace-builds/src-noconflict');
  ace.config.set('themePath', '/node_modules/ace-builds/src-noconflict');
  ace.config.set('workerPath', '/node_modules/ace-builds/src-noconflict');

  // 预加载常用模块
  const preloadModules = (): void => {
    // 预加载扩展
    importModule('ext-language_tools');
    importModule('ext-searchbox');

    // 预加载主题
    importModule('theme-github');
    importModule('theme-monokai');
    importModule('theme-chrome');

    // 预加载语言模式
    importModule('mode-json');
    importModule('mode-xml');
    importModule('mode-javascript');
    importModule('mode-html');
    importModule('mode-text');
  };

  // 只在Web环境执行预加载
  preloadModules();
} else {
  console.log('VSCode环境: 跳过Ace模块动态加载');
  // VSCode环境中不执行预加载，依赖VSCode扩展提供的配置
}

export default ace;