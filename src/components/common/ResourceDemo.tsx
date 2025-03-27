/**
 * 资源加载示例组件
 * 用于演示在不同环境中资源加载适配器的工作方式
 */
import React, { useState, useEffect } from 'react';
import { isVSCodeEnvironment } from '../../utils/environment';
import { getResourcePath } from '../../utils/resourceLoader';
import Image from './Image';

/**
 * 资源加载演示组件
 */
const ResourceDemo: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // 使用资源加载适配器加载静态资源
    setIsLoading(true);
    setError(null);
    
    // 尝试加载FHIR图标
    getResourcePath('resource-demo.svg')
      .then(path => {
        setLogoUrl(path);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('加载资源失败:', err);
        setError(`加载失败: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      });
  }, []);
  
  return (
    <div className="resource-demo">
      <h3>资源加载演示</h3>
      <p>当前环境: {isVSCodeEnvironment() ? 'VS Code' : 'Web'}</p>
      
      {isLoading && (
        <div className="loading">资源加载中...</div>
      )}
      
      {error && (
        <div className="error">{error}</div>
      )}
      
      {!isLoading && !error && logoUrl && (
        <div className="resource-display">
          <p>直接使用URL加载的图像:</p>
          <img 
            src={logoUrl} 
            alt="FHIR图标" 
            style={{ width: 100, height: 100 }} 
          />
          
          <p>使用Image组件加载的图像:</p>
          <Image 
            src="resource-demo.svg" 
            alt="FHIR图标" 
            width={100} 
            height={100}
          />
        </div>
      )}
      
      <div className="info">
        <p>资源加载适配器可以在不同环境中正确加载资源:</p>
        <ul>
          <li>在Web环境中，资源通过相对路径或基础URL加载</li>
          <li>在VS Code环境中，资源通过VS Code Webview API安全加载</li>
        </ul>
      </div>
    </div>
  );
};

export default ResourceDemo; 