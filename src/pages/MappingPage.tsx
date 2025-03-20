// import React from 'react';
// import Layout from '../components/layout/Layout';
// import MappingEditor from '../components/mapping/MappingEditor';

// const MappingPage = () => {
//   return (
//     <Layout>
//       <div className="container mx-auto px-4 py-6">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">映射配置</h1>
//           <p className="text-gray-600">
//             配置逻辑模型与FHIR资源之间的映射关系，以及逻辑模型与第三方数据之间的映射关系。
//           </p>
//         </div>
        
//         <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
//           <MappingEditor />
//         </div>
        
//         <div className="mt-8 bg-indigo-50 rounded-lg p-5 border border-indigo-100">
//           <h2 className="text-xl font-semibold text-indigo-800 mb-3">映射配置提示</h2>
//           <ul className="list-disc pl-6 space-y-2 text-gray-700">
//             <li>先确保已完成元数据设计，再进行映射配置</li>
//             <li>可以为字段配置简单的转换函数，如数据类型转换、格式化等</li>
//             <li>对于复杂的转换逻辑，可以使用高级表达式</li>
//             <li>支持一对多、多对一的字段映射关系</li>
//             <li>配置完成后，可以在可视化页面查看映射关系图</li>
//           </ul>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default MappingPage; 

import React, { useState } from 'react';
import { Card, Tabs, message } from 'antd';
import MappingConfigurator from '../components/mapping/MappingConfigurator';
import VisualMapper from '../components/mapping/VisualMapper';
import type { MappingConfig } from '../types/logicModel';
import type { DataDomain } from '../types/metadata';

const { TabPane } = Tabs;

interface MappingPageProps {
  dataDomains: DataDomain[];
}

const MappingPage: React.FC<MappingPageProps> = ({ dataDomains }) => {
  const [currentMapping, setCurrentMapping] = useState<MappingConfig | null>(null);
  const [sourceFields] = useState<any[]>([]);
  const [targetFields] = useState<any[]>([]);

  const handleMappingSave = async (config: MappingConfig) => {
    try {
      setCurrentMapping(config);
      message.success('映射配置保存成功');
    } catch (error) {
      message.error('保存映射配置失败');
    }
  };

  return (
    <div className="p-6">
      <Card title="FHIR映射工具" className="mb-6">
        <Tabs defaultActiveKey="1">
          <TabPane tab="映射配置" key="1">
            <MappingConfigurator
              dataDomains={dataDomains}
              onSave={handleMappingSave}
            />
          </TabPane>
          <TabPane tab="可视化映射" key="2">
            {currentMapping && (
              <VisualMapper
                mappingConfig={currentMapping}
                sourceFields={sourceFields}
                targetFields={targetFields}
              />
            )}
          </TabPane>
          <TabPane tab="数据转换" key="3">
            <Card title="数据转换">
              {/* 这里可以添加数据转换的UI组件 */}
              <div>数据转换功能开发中...</div>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      <Card title="使用说明" className="mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">配置步骤</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>选择数据域和需要映射的模型</li>
              <li>配置字段映射关系</li>
              <li>添加必要的数据转换规则</li>
              <li>保存映射配置</li>
              <li>在可视化页面查看映射关系</li>
              <li>使用数据转换功能验证映射结果</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">支持的功能</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>FHIR资源与逻辑模型的双向映射</li>
              <li>第三方数据格式的导入和转换</li>
              <li>可视化的映射关系展示</li>
              <li>灵活的数据转换规则配置</li>
              <li>支持XML和JSON格式的数据处理</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MappingPage; 