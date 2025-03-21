import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartSimple, 
  faDiagramProject, 
  faFileImport, 
  faCodeBranch,
  faArrowRight,
  faImage
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../layouts/MainLayout';
import { useAppStore } from '../store';
import { Dispatch, SetStateAction } from 'react';

interface HomePageProps {
  onNavigate: Dispatch<SetStateAction<string>>;
}

const HomePage = ({ onNavigate }: HomePageProps) => {
  const { domains, logicDtoModels, thirdPartyModels, mappingConfigurations } = useAppStore();

  const handleNavigate = (path: string) => {
    window.location.hash = path;
    onNavigate(path);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* 头部横幅 */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-400 text-white rounded-lg shadow-lg p-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-bold mb-4">FHIR 映射逻辑模型设计器</h1>
            <p className="text-xl mb-6">
              设计标准逻辑模型，将FHIR资源与第三方数据格式进行映射，以实现无缝数据转换和互操作性。
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => handleNavigate('logic-models')}
                className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-md shadow hover:bg-primary-50 transition-colors"
              >
                开始设计
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
              <button 
                onClick={() => handleNavigate('documents')}
                className="inline-flex items-center px-4 py-2 border border-white text-white rounded-md hover:bg-white/10 transition-colors"
              >
                查看文档
              </button>
            </div>
          </div>
        </section>

        {/* 状态概览 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-md">
                <FontAwesomeIcon icon={faChartSimple} className="text-primary-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">数据领域</h3>
                <p className="text-2xl font-bold">{domains.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-md">
                <FontAwesomeIcon icon={faDiagramProject} className="text-green-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">逻辑模型</h3>
                <p className="text-2xl font-bold">{logicDtoModels.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-md">
                <FontAwesomeIcon icon={faFileImport} className="text-purple-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">第三方模型</h3>
                <p className="text-2xl font-bold">{thirdPartyModels.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-md">
                <FontAwesomeIcon icon={faCodeBranch} className="text-orange-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">映射配置</h3>
                <p className="text-2xl font-bold">{mappingConfigurations.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 功能介绍卡片 */}
        <section>
          <h2 className="text-2xl font-serif font-bold mb-6">主要功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-[1.02]">
              <div className="h-3 bg-primary-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">逻辑模型设计</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  设计标准化的逻辑数据模型(LogicDto)，作为第三方数据与FHIR格式之间的中间层。
                </p>
                <button
                  onClick={() => handleNavigate('logic-models')}
                  className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
                >
                  开始设计
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-sm" />
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-[1.02]">
              <div className="h-3 bg-blue-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">视觉逻辑模型图</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  将逻辑模型可视化为直观的图形表示，展示字段关系和结构，便于理解和共享。
                </p>
                <button
                  onClick={() => handleNavigate('visual-models')}
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  查看图表
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-sm" />
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-[1.02]">
              <div className="h-3 bg-green-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">第三方数据模型</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  定义第三方数据模型结构，支持从JSON或XML自动生成，处理一对一或一对多的子对象关系。
                </p>
                <button
                  onClick={() => handleNavigate('third-party-models')}
                  className="inline-flex items-center text-green-600 dark:text-green-400 hover:underline"
                >
                  开始定义
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-sm" />
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-[1.02]">
              <div className="h-3 bg-purple-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">映射配置管理</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  配置数据映射关系，支持第三方数据、逻辑模型和FHIR格式之间的双向映射。
                </p>
                <button
                  onClick={() => handleNavigate('mapping')}
                  className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline"
                >
                  开始配置
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-sm" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 数据领域列表 */}
        <section>
          <h2 className="text-2xl font-serif font-bold mb-6">数据领域</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {domains.map((domain) => (
                <li key={domain.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{domain.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{domain.description}</p>
                    </div>
                    <button
                      onClick={() => handleNavigate(`domains/${domain.id}`)}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      查看
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default HomePage; 