/**
 * 复制Ace Editor资源到VSCode扩展资源目录
 * 
 * 这个脚本会将ace-builds资源复制到vscode-extension/resources目录，
 * 以便VSCode扩展可以正确加载Ace Editor资源。
 */

const fs = require('fs');
const path = require('path');

// 源路径和目标路径
const ACE_SRC_PATH = path.resolve(__dirname, 'node_modules', 'ace-builds');
const ACE_DEST_PATH = path.resolve(__dirname, 'vscode-extension', 'resources', 'ace-builds');

// 创建目标目录
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`创建目录: ${directory}`);
  }
}

// 复制文件或目录
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    ensureDirectoryExists(dest);
    
    // 读取源目录内容
    const entries = fs.readdirSync(src);
    
    // 递归复制每个条目
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyRecursive(srcPath, destPath);
    }
  } else {
    // 复制文件
    fs.copyFileSync(src, dest);
    console.log(`复制文件: ${src} -> ${dest}`);
  }
}

// 确保目标目录存在
ensureDirectoryExists(ACE_DEST_PATH);

// 将src-noconflict目录复制到目标目录
const srcNoConflictPath = path.join(ACE_SRC_PATH, 'src-noconflict');
const destNoConflictPath = path.join(ACE_DEST_PATH, 'src-noconflict');

if (fs.existsSync(srcNoConflictPath)) {
  copyRecursive(srcNoConflictPath, destNoConflictPath);
  console.log('成功复制Ace Editor资源到VSCode扩展资源目录');
} else {
  console.error(`错误: 找不到Ace Editor资源目录: ${srcNoConflictPath}`);
  process.exit(1);
}

// 复制webpack-resolver.js
const webpackResolverSrc = path.join(ACE_SRC_PATH, 'webpack-resolver.js');
const webpackResolverDest = path.join(ACE_DEST_PATH, 'webpack-resolver.js');

if (fs.existsSync(webpackResolverSrc)) {
  fs.copyFileSync(webpackResolverSrc, webpackResolverDest);
  console.log(`复制文件: ${webpackResolverSrc} -> ${webpackResolverDest}`);
} else {
  console.warn(`警告: 找不到webpack-resolver.js: ${webpackResolverSrc}`);
}

console.log('Ace Editor资源复制完成！'); 