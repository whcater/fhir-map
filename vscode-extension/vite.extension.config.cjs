// 改用CommonJS方式导入
const { defineConfig } = require('vite');
const path = require('path');

// 使用Node.js内置变量或当前工作目录
const workingDir = process.cwd();

/**
 * Vite配置 - VS Code插件Extension部分
 * 用于构建扩展的主要代码
 */
module.exports = defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    // 构建配置
    build: {
      // 输出目录
      outDir: 'dist/web',
      // 库模式
      lib: {
        // 扩展入口
        entry: path.resolve(workingDir, 'src/web/extension.ts'),
        // 输出格式为CommonJS (VS Code要求)
        formats: ['cjs'],
        // 输出文件名
        fileName: () => 'extension.js',
      },
      // Rollup配置
      rollupOptions: {
        // 外部依赖
        external: [
          'vscode',
        ],
        // 输出配置
        output: {
          // 保持外部化模块为require格式
          format: 'cjs',
          // 设置适当的sourcemap类型
          sourcemapExcludeSources: isProd,
          // 确保使用CommonJS模块语法
          interop: 'auto',
          // 使用Node.js风格的导出
          exports: 'named',
        },
      },
      // 源码映射
      sourcemap: true,
      // 生产环境压缩代码
      minify: isProd ? 'esbuild' : false,
      // 设置环境变量替换
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
      },
      // 确保生成CommonJS模块
      modulePreload: false,
      target: 'node14',
    },
    
    // 解析配置
    resolve: {
      // 确保.ts文件可以被正确解析
      extensions: ['.ts', '.js', '.json'],
    },
    
    // 避免清空控制台信息
    clearScreen: false,
  };
}); 