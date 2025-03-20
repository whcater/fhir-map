import React, { useState } from 'react';
import { MappingConfig } from '../../types/models';

interface DataConverterProps {
  availableMappings: MappingConfig[];
}

const DataConverter: React.FC<DataConverterProps> = ({ availableMappings }) => {
  const [selectedMappingId, setSelectedMappingId] = useState<string>('');
  const [conversionDirection, setConversionDirection] = useState<'sourceToTarget' | 'targetToSource'>('sourceToTarget');
  const [inputData, setInputData] = useState<string>('');
  const [outputData, setOutputData] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleConvert = () => {
    setIsConverting(true);
    setErrorMessage('');
    
    try {
      // 验证输入
      if (!selectedMappingId) {
        throw new Error('请选择映射配置');
      }
      
      if (!inputData.trim()) {
        throw new Error('请输入要转换的数据');
      }
      
      // 解析输入数据
      let parsedInputData: Record<string, any>;
      try {
        parsedInputData = JSON.parse(inputData);
      } catch (e) {
        throw new Error('输入数据不是有效的JSON格式');
      }
      
      // 获取选中的映射配置
      const selectedMapping = availableMappings.find(m => m.id === selectedMappingId);
      if (!selectedMapping) {
        throw new Error('无法找到选中的映射配置');
      }
      
      // 模拟转换操作
      // 实际实现中，这里应该调用实际的转换逻辑
      setTimeout(() => {
        // 这只是一个示例转换，实际应用中应该实现真正的转换逻辑
        const result = {
          original: parsedInputData,
          mappingName: selectedMapping.name,
          direction: conversionDirection,
          timestamp: new Date().toISOString(),
          convertedData: {
            // 示例输出，实际应用中应替换为真实转换结果
            resourceType: 'Bundle',
            type: 'collection',
            entry: [
              {
                resource: {
                  resourceType: 'Patient',
                  id: 'example',
                  name: [
                    {
                      family: '张',
                      given: ['三']
                    }
                  ]
                }
              }
            ]
          }
        };
        
        setOutputData(JSON.stringify(result.convertedData, null, 2));
        setIsConverting(false);
      }, 1000); // 模拟延迟
      
    } catch (error: any) {
      setErrorMessage(error.message || '转换过程中发生未知错误');
      setIsConverting(false);
    }
  };

  const handleClear = () => {
    setInputData('');
    setOutputData('');
    setErrorMessage('');
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-6">数据转换</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            选择映射配置
          </label>
          <select 
            className="input"
            value={selectedMappingId}
            onChange={(e) => setSelectedMappingId(e.target.value)}
          >
            <option value="">请选择映射配置</option>
            {availableMappings.map((mapping) => (
              <option key={mapping.id} value={mapping.id}>
                {mapping.name} ({mapping.domain})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            转换方向
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                className="h-4 w-4 text-primary-600 border-gray-300"
                checked={conversionDirection === 'sourceToTarget'}
                onChange={() => setConversionDirection('sourceToTarget')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                源模型 → 目标模型
              </span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="radio" 
                className="h-4 w-4 text-primary-600 border-gray-300"
                checked={conversionDirection === 'targetToSource'}
                onChange={() => setConversionDirection('targetToSource')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                目标模型 → 源模型
              </span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              输入数据 (JSON格式)
            </label>
            <button
              type="button"
              className="text-xs text-primary-600 hover:text-primary-700"
              onClick={() => {
                try {
                  setInputData(JSON.stringify(JSON.parse(inputData), null, 2));
                } catch (e) {
                  // 不做任何处理，如果不是有效JSON则不格式化
                }
              }}
            >
              格式化
            </button>
          </div>
          <textarea
            className="input font-mono h-96"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="粘贴待转换的JSON数据..."
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              输出结果
            </label>
            <button
              type="button"
              className="text-xs text-primary-600 hover:text-primary-700"
              onClick={() => {
                const el = document.createElement('textarea');
                el.value = outputData;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                alert('已复制到剪贴板');
              }}
            >
              复制结果
            </button>
          </div>
          <textarea
            className="input font-mono h-96"
            value={outputData}
            readOnly
            placeholder="转换结果将在这里显示..."
          />
        </div>
      </div>
      
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
          <p><i className="fas fa-exclamation-circle mr-2"></i>{errorMessage}</p>
        </div>
      )}
      
      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleClear}
          disabled={isConverting}
        >
          清空
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConvert}
          disabled={isConverting}
        >
          {isConverting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              转换中...
            </>
          ) : '执行转换'}
        </button>
      </div>
    </div>
  );
};

export default DataConverter; 