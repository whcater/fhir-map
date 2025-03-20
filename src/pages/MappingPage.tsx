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

import React from 'react';
import { Card } from 'antd';
import { DataDomain } from '../types/metadata';

interface MappingPageProps {
  dataDomains: DataDomain[];
}

const MappingPage: React.FC<MappingPageProps> = ({ dataDomains }) => {
  return (
    <Card title="映射配置">
      <div>映射配置页面（待实现）</div>
    </Card>
  );
};

export default MappingPage; 