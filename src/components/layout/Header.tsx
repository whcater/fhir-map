import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleDarkMode, isDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <i className="fas fa-project-diagram text-primary-600 dark:text-primary-400 text-2xl mr-2"></i>
              <span className="text-xl font-serif font-bold text-gray-900 dark:text-white">FHIR Bundle Logic Model Designer</span>
            </Link>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>

          {/* 桌面端导航菜单 */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/metadata" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400">
              元数据管理
            </Link>
            <Link to="/mappings" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400">
              映射配置
            </Link>
            <Link to="/visualizer" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400">
              可视化
            </Link>
            <Link to="/conversion" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400">
              数据转换
            </Link>
            <div className="toggle-switch">
              <input 
                type="checkbox" 
                id="dark-mode-toggle" 
                checked={isDarkMode}
                onChange={onToggleDarkMode}
              />
              <label htmlFor="dark-mode-toggle" className="toggle-slider"></label>
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                {isDarkMode ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
              </span>
            </div>
          </nav>
        </div>

        {/* 移动端导航菜单 */}
        {isMenuOpen && (
          <nav className="mt-4 md:hidden space-y-4 py-2">
            <Link 
              to="/metadata" 
              className="block text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={() => setIsMenuOpen(false)}
            >
              元数据管理
            </Link>
            <Link 
              to="/mappings" 
              className="block text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={() => setIsMenuOpen(false)}
            >
              映射配置
            </Link>
            <Link 
              to="/visualizer" 
              className="block text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={() => setIsMenuOpen(false)}
            >
              可视化
            </Link>
            <Link 
              to="/conversion" 
              className="block text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={() => setIsMenuOpen(false)}
            >
              数据转换
            </Link>
            <div className="toggle-switch pt-2">
              <input 
                type="checkbox" 
                id="dark-mode-toggle-mobile" 
                checked={isDarkMode}
                onChange={onToggleDarkMode}
              />
              <label htmlFor="dark-mode-toggle-mobile" className="toggle-slider"></label>
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                {isDarkMode ? "深色模式" : "浅色模式"}
              </span>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 