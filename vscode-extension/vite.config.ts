import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 获取当前文件的目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite配置 - VS Code插件Webview部分
 */
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    // 插件配置
    plugins: [
      react(),
      // 自定义插件，确保CSS文件被正确复制到输出目录
      {
        name: 'vscode-copy-css',
        apply: 'build',
        enforce: 'post',
        writeBundle: {
          sequential: true,
          order: 'post',
          handler(options) {
            // 获取输出目录
            const outDir = options.dir || 'dist/webview';
            
            // 读取源CSS文件
            const sourceCssPath = path.resolve(__dirname, 'src/webview/index.css');
            if (fs.existsSync(sourceCssPath)) {
              const cssContent = fs.readFileSync(sourceCssPath, 'utf-8');
              
              // 写入目标CSS文件
              const targetCssPath = path.resolve(outDir, 'index.css');
              fs.writeFileSync(targetCssPath, cssContent);
              
              console.log(`已复制CSS文件到 ${targetCssPath}`);
            }
          }
        }
      }
    ],
    
    // CSS处理配置
    css: {
      postcss: path.resolve(__dirname, 'postcss.config.cjs'),
      // 禁用CSS模块化
      modules: {
        scopeBehaviour: 'global'
      }
    },
    
    // 构建配置
    build: {
      // 输出目录
      outDir: 'dist/webview',
      // 生产环境禁用sourcemap
      sourcemap: !isProd,
      // 不压缩代码，为了调试
      minify: isProd,
      // 提取CSS到单独的文件
      cssCodeSplit: false,
      // 配置Rollup打包选项
      rollupOptions: {
        // 指定入口文件
        input: {
          index: path.resolve(__dirname, 'src/webview/index.tsx'),
        },
        // 输出配置
        output: {
          // 入口文件名格式
          entryFileNames: '[name].js',
          // 资源文件名格式
          assetFileNames: (assetInfo) => {
            // 确保CSS文件保持原始名称
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return '[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          // 内联动态导入，避免运行时添加脚本标签
          inlineDynamicImports: true,
        },
      },
      // 预加载所有资源，减少运行时的 DOM 操作
      assetsInlineLimit: 100000000, // 较大的值以内联小资源
      emptyOutDir: true,
    },
    
    // 解析配置
    resolve: {
      alias: {
        // 项目根目录的src别名
        '@': path.resolve(__dirname, '../src'),
        // VSCode特定代码的别名
        '@vscode': path.resolve(__dirname, 'src/webview'),
      },
      // 确保import的文件可以省略扩展名
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    
    // 优化依赖
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
      ],
      // 强制预构建所有依赖
      force: true,
    },
    
    // 定义环境变量
    define: {
      // 设置生产/开发环境
      'process.env.NODE_ENV': JSON.stringify(mode),
      // 标记为VS Code环境
      'process.env.VSCODE': JSON.stringify(true),
    },
    
    // 避免Vite清空控制台信息
    clearScreen: false,
  };
}); 