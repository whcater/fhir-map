import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const HomePage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FHIR Bundle逻辑模型设计器</h1>
          <p className="text-xl text-gray-600">
            一个强大的工具，用于设计和管理FHIR资源与逻辑模型之间的映射
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">元数据设计</h2>
            <p className="text-gray-600 mb-6">
              设计和管理逻辑数据模型的元数据结构，定义字段和数据类型，支持从JSON/XML导入。
            </p>
            <Link
              to="/metadata"
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              开始设计
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">映射配置</h2>
            <p className="text-gray-600 mb-6">
              配置逻辑模型与FHIR资源之间的映射关系，以及逻辑模型与第三方数据之间的映射关系。
            </p>
            <Link
              to="/mapping"
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              配置映射
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">可视化模型</h2>
            <p className="text-gray-600 mb-6">
              可视化展示逻辑模型与FHIR资源之间的映射关系，帮助理解和验证映射配置。
            </p>
            <Link
              to="/visual"
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              查看可视化
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">数据转换</h2>
            <p className="text-gray-600 mb-6">
              基于配置的映射关系，在不同数据格式之间进行转换，支持各种转换方向。
            </p>
            <Link
              to="/conversion"
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              开始转换
            </Link>
          </div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
          <h2 className="text-xl font-semibold text-indigo-800 mb-4">关于FHIR Bundle逻辑模型设计器</h2>
          <p className="text-gray-700 mb-4">
            FHIR Bundle逻辑模型设计器是一个专为医疗数据集成设计的工具，它可以帮助您：
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>设计与管理逻辑数据模型</li>
            <li>定义逻辑模型与FHIR资源之间的映射</li>
            <li>配置逻辑模型与第三方数据之间的映射</li>
            <li>实现不同数据格式之间的双向转换</li>
            <li>可视化展示映射关系</li>
          </ul>
          <p className="text-gray-700">
            通过这个工具，您可以更高效地进行医疗数据的标准化处理，提高数据互操作性。
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage; 