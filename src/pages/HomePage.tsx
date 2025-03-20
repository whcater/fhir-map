import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero区域 */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 -mx-4 px-4 py-16 text-white rounded-lg shadow-xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            FHIR Bundle Logic Model Designer
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            专业的FHIR资源映射与转换工具，简化医疗数据互操作性
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/metadata" className="btn bg-white text-primary-700 hover:bg-gray-100">
              开始使用
            </Link>
            <a href="#features" className="btn bg-transparent border-2 border-white hover:bg-white/10">
              了解功能
            </a>
          </div>
        </div>
      </section>

      {/* 主要功能介绍 */}
      <section id="features" className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">主要功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-center mb-4">
              <i className="fas fa-database text-4xl text-primary-500"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">元数据管理</h3>
            <p className="text-gray-600 dark:text-gray-400">
              定义和管理逻辑模型和第三方数据的元数据，支持从JSON/XML自动生成
            </p>
          </div>
          
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-center mb-4">
              <i className="fas fa-exchange-alt text-4xl text-primary-500"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">映射配置</h3>
            <p className="text-gray-600 dark:text-gray-400">
              可视化配置字段映射关系，支持复杂转换逻辑和条件表达式
            </p>
          </div>
          
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-center mb-4">
              <i className="fas fa-project-diagram text-4xl text-primary-500"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">可视化展示</h3>
            <p className="text-gray-600 dark:text-gray-400">
              直观展示模型间的映射关系图，一目了然地理解数据流
            </p>
          </div>
          
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-center mb-4">
              <i className="fas fa-sync-alt text-4xl text-primary-500"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">数据转换</h3>
            <p className="text-gray-600 dark:text-gray-400">
              基于配置的映射关系，高效执行各种格式间的数据转换
            </p>
          </div>
        </div>
      </section>
      
      {/* 转换流程图 */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800 -mx-4 px-4 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">数据转换流程</h2>
        <div className="card max-w-4xl mx-auto">
          <div className="mermaid">
            {`
            flowchart LR
                A[第三方数据<br/>3thDto] --> |映射配置| B[逻辑模型<br/>LogicDto]
                B --> |映射配置| C[FHIR Bundle]
                C --> |映射配置| B
                B --> |映射配置| A
                style A fill:#f9d5e5,stroke:#333,stroke-width:2px
                style B fill:#d5e8f9,stroke:#333,stroke-width:2px
                style C fill:#e5f9d5,stroke:#333,stroke-width:2px
            `}
          </div>
        </div>
      </section>
      
      {/* 使用场景 */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">适用场景</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <i className="fas fa-hospital text-primary-500 mr-3"></i>
              医疗系统集成
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              将现有医疗信息系统的数据模型映射到FHIR标准，实现系统间无缝交互。
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
              <li>电子病历系统整合</li>
              <li>检验系统数据交换</li>
              <li>医疗影像系统接入</li>
            </ul>
          </div>
          
          <div className="card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <i className="fas fa-cloud text-primary-500 mr-3"></i>
              数据互操作性
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              提升不同医疗机构之间的数据互操作能力，促进医疗数据在不同场景下的共享与利用。
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
              <li>跨机构医疗信息交换</li>
              <li>医疗数据分析研究</li>
              <li>远程医疗数据支持</li>
            </ul>
          </div>
        </div>
      </section>
      
      {/* CTA区域 */}
      <section className="py-12 bg-gradient-to-r from-primary-600 to-secondary-600 -mx-4 px-4 text-white rounded-lg shadow-xl text-center">
        <h2 className="text-3xl font-bold mb-6">立即开始使用</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          开始构建您的FHIR数据映射与转换体系，简化医疗数据互操作性
        </p>
        <Link to="/metadata" className="btn bg-white text-primary-700 hover:bg-gray-100">
          开始使用
        </Link>
      </section>
    </div>
  );
};

export default HomePage; 