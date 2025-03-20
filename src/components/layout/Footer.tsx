import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} FHIR Bundle Logic Model Designer. 保留所有权利。
            </p>
          </div>
          <div className="flex space-x-4">
            <a 
              href="https://www.hl7.org/fhir/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              FHIR 官方文档
            </a>
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 bg-transparent border-none cursor-pointer"
              onClick={() => alert('关于我们功能即将上线')}
            >
              关于我们
            </button>
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 bg-transparent border-none cursor-pointer"
              onClick={() => alert('使用帮助功能即将上线')}
            >
              使用帮助
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 