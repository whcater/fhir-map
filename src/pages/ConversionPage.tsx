import React from 'react';
import Layout from '../components/layout/Layout';
import DataConverter from '../components/converters/DataConverter';
import { sampleDataDomains } from '../data/sampleData';

const ConversionPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据转换</h1>
          <p className="text-gray-600">
            基于配置的映射关系，在不同数据格式之间进行转换，支持各种转换方向。
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <DataConverter dataDomains={sampleDataDomains} />
        </div>
        
        <div className="mt-8 bg-indigo-50 rounded-lg p-5 border border-indigo-100">
          <h2 className="text-xl font-semibold text-indigo-800 mb-3">数据转换提示</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>确保已完成元数据设计和映射配置</li>
            <li>支持JSON和XML格式的输入数据</li>
            <li>可以选择不同的转换方向：第三方→逻辑模型→FHIR，或FHIR→逻辑模型→第三方</li>
            <li>转换结果可导出为JSON或XML文件</li>
            <li>如果转换过程中出现错误，系统会提供详细的错误信息</li>
            <li>大型数据集转换可能需要较长时间，请耐心等待</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ConversionPage; 