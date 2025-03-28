import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite配置
 * Web应用的构建配置
 */
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  // 强制使用开发模式
  const isProd = mode === 'production';

  return {
    // 插件配置
    plugins: [
      // 使用开发版本的React用于更好的错误信息
      react({
        // 强制使用开发版本的React（仅用于调试）
        jsxRuntime: 'automatic', // 从classic改为automatic以处理React引用
        babel: {
          // 禁用React JSX转换，避免重复属性问题
          plugins: []
        }
      }),
    ],

    // 解析配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    // 构建配置
    build: {
      // 输出目录
      outDir: 'dist',
      // 启用源码映射（生产环境可关闭）
      sourcemap: true, // 始终启用源码映射用于调试
      // 自动拆分chunks
      rollupOptions: {
        output: {
          // 确保生成一个正确的全局变量
          format: 'iife',
          // 显式指定全局变量
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM'
          }
        },
      },
      // 设置chunk大小警告阈值
      chunkSizeWarningLimit: 1000,
      // 禁用最小化以便于调试
      minify: false,
    },

    // 开发服务器配置
    server: {
      port: 3000,
      open: true,
      host: true,
    },

    // 依赖优化
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
      ],
      force: true, // 强制预构建
    },

    // 预览配置
    preview: {
      port: 8080,
    },

    // 定义环境变量
    define: {
      // 全局环境变量
      'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
      'process.env.NODE_ENV': JSON.stringify('development')
    },
  };
}); 