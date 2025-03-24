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
  const isProd = mode === 'production';

  return {
    // 插件配置
    plugins: [
      react(),
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
      sourcemap: !isProd,
      // 自动拆分chunks
      rollupOptions: {
        output: {
          manualChunks: {
            // 将React相关库打包到一个chunk
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // 将其他第三方库打包到一个chunk
            'vendor': [
              // 添加你的第三方依赖
            ],
          },
        },
      },
      // 设置chunk大小警告阈值
      chunkSizeWarningLimit: 1000,
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
    },

    // 预览配置
    preview: {
      port: 8080,
    },

    // 定义环境变量
    define: {
      // 全局环境变量
      'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
}); 