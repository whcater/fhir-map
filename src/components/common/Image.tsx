/**
 * 通用图像组件
 * 用于在不同环境中一致地加载和渲染图像
 */
import React, { useState, useEffect } from 'react';
import { getImagePath } from '../../utils/resourceLoader';

/**
 * 图像组件属性
 */
export interface ImageProps {
  /** 图像源路径（相对于images目录） */
  src: string;
  /** 替代文本 */
  alt: string;
  /** CSS类名 */
  className?: string;
  /** 宽度 */
  width?: number | string;
  /** 高度 */
  height?: number | string;
  /** 加载错误回调 */
  onError?: () => void;
  /** 加载完成回调 */
  onLoad?: () => void;
}

/**
 * 通用图像组件
 * 自动处理VS Code和Web环境的图像加载差异
 */
const Image: React.FC<ImageProps> = ({ 
  src, 
  alt, 
  className, 
  width, 
  height,
  onError,
  onLoad
}) => {
  // 图像源状态
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // 当src改变时获取正确的图像路径
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    // 获取适配后的图像路径
    getImagePath(src)
      .then(path => {
        setImageSrc(path);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('加载图像失败:', err, src);
        setHasError(true);
        setIsLoading(false);
        if (onError) onError();
      });
  }, [src, onError]);
  
  // 处理图像加载错误
  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };
  
  // 处理图像加载完成
  const handleLoad = () => {
    if (onLoad) onLoad();
  };
  
  // 如果正在加载，显示占位符
  if (isLoading) {
    return (
      <div 
        className={`image-placeholder ${className || ''}`}
        style={{ 
          width: width || '100%', 
          height: height || '100%',
          backgroundColor: 'var(--vscode-editor-inactiveSelectionBackground, #f0f0f0)'
        }}
        aria-label={`${alt} 加载中`}
      />
    );
  }
  
  // 如果加载错误，显示错误占位符
  if (hasError) {
    return (
      <div 
        className={`image-error ${className || ''}`}
        style={{ 
          width: width || '100%', 
          height: height || '100%',
          backgroundColor: 'var(--vscode-errorBackground, #ffdddd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--vscode-errorForeground, #ff0000)'
        }}
        aria-label={`${alt} 加载失败`}
      >
        图像加载失败
      </div>
    );
  }
  
  // 渲染图像
  return (
    <img 
      src={imageSrc}
      alt={alt} 
      className={className}
      width={width}
      height={height}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
};

export default Image; 