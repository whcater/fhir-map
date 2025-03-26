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
  // 始终使用开发模式来获取更多详细的错误信息
  const isProd = false; // 强制使用开发模式进行构建
  
  return {
    // 插件配置
    plugins: [
      // 使用开发版本的React
      react({
        // 配置React开发模式
        jsxRuntime: 'automatic',
        // 禁用React JSX转换，避免重复属性问题
        babel: {
          // 不启用带有__source和__self属性的调试模式
          plugins: []
        }
      }),
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
      // 始终启用sourcemap以便调试
      sourcemap: true,
      // 禁用代码压缩，以便于调试
      minify: false,
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
          // 确保生成一个正确的全局变量
          format: 'iife',
          // 显式指定全局变量
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM'
          }
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
      'process.env.NODE_ENV': JSON.stringify('development'), // 强制设置为开发环境
      // 标记为VS Code环境
      'process.env.VSCODE': JSON.stringify(true),
      // 确保在没有React全局变量时也能工作
      'global.React': 'React',
    },
    
    // 避免Vite清空控制台信息
    clearScreen: false,
  };
}); 