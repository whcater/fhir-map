import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**@type {import('webpack').Configuration}*/
export default {
  target: 'webworker', // VS Code extensions run in a webworker context
  mode: 'none', // 'production' or 'development' or 'none'
  entry: './src/web/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist', 'web'),
    filename: 'extension.js',
    libraryTarget: 'commonjs'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  externals: {
    vscode: 'commonjs vscode' // ignore vscode module
  },
  performance: {
    hints: false
  },
  devtool: 'nosources-source-map'
}; 