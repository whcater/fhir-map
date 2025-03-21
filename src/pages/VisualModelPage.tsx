import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSearch, faFilter, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../layouts/MainLayout';
import { useAppStore } from '../store';
import VisualModelGraph from '../components/VisualModelGraph';
import { LogicDtoModel } from '../types';
import { downloadJson } from '../utils';

const VisualModelPage = () => {
  // 从store获取模型和领域数据
  const { logicDtoModels, domains } = useAppStore();
  
  // 状态
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<LogicDtoModel | null>(null);
  
  // 当前系统的主题模式
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  // 根据筛选条件过滤模型
  const filteredModels = logicDtoModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain ? model.domainId === selectedDomain : true;
    return matchesSearch && matchesDomain;
  });
  
  // 当选择模型ID变化时，更新选中的模型
  useEffect(() => {
    if (selectedModelId) {
      const model = logicDtoModels.find(m => m.id === selectedModelId) || null;
      
      // 验证模型数据的有效性
      if (model) {
        const isValid = 
          model.fields && 
          Array.isArray(model.fields) && 
          model.name && 
          typeof model.name === 'string';
        
        if (!isValid) {
          console.error('模型数据无效:', model);
        }
      }
      
      setSelectedModel(model);
    } else {
      setSelectedModel(null);
    }
  }, [selectedModelId, logicDtoModels]);
  
  // 导出模型定义
  const handleExportModel = () => {
    if (selectedModel) {
      downloadJson(selectedModel, `${selectedModel.name}-模型定义.json`);
    }
  };
  
  // 获取领域名称
  const getDomainName = (domainId: string) => {
    return domains.find(domain => domain.id === domainId)?.name || '未知领域';
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold">视觉逻辑模型图</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧面板：模型选择 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-lg font-serif font-semibold mb-4">选择模型</h2>
              
              {/* 搜索和筛选 */}
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    placeholder="搜索模型..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                  </div>
                  <select
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    value={selectedDomain}
                    onChange={e => setSelectedDomain(e.target.value)}
                  >
                    <option value="">所有领域</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.id}>{domain.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 模型列表 */}
              <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-md">
                {filteredModels.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredModels.map(model => (
                      <li key={model.id} className="p-2">
                        <button
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                            selectedModelId === model.id
                              ? 'bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500'
                              : ''
                          }`}
                          onClick={() => setSelectedModelId(model.id)}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getDomainName(model.domainId)} - {model.fields.length}个字段
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    没有找到匹配的模型
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧面板：视觉模型图 */}
          <div className="lg:col-span-3">
            {selectedModel ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-serif font-semibold">{selectedModel.name}</h2>
                  <button
                    onClick={handleExportModel}
                    title="导出模型定义"
                    className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-md flex items-center"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    导出模型
                  </button>
                </div>
                
                {selectedModel.description && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedModel.description}</p>
                  </div>
                )}
                
                {/* 警告提示：无字段 */}
                {(!selectedModel.fields || selectedModel.fields.length === 0) && (
                  <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 dark:text-yellow-400 mr-2" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        此模型没有字段。请先在逻辑模型设计中添加字段后再查看视觉模型图。
                      </p>
                    </div>
                  </div>
                )}
                
                <VisualModelGraph
                  model={selectedModel}
                  theme={isDarkMode ? 'dark' : 'light'}
                />
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 flex flex-col items-center justify-center">
                <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">
                  <FontAwesomeIcon icon={faSearch} />
                </div>
                <h3 className="text-xl font-serif text-center mb-2">请选择一个逻辑模型</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                  从左侧面板选择一个逻辑模型，查看其视觉图表示。图表将展示模型结构和字段关系。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VisualModelPage; 