import { useState, useEffect, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSun, 
  faMoon, 
  faChartSimple, 
  faHome, 
  faDiagramProject, 
  faFileImport, 
  faCodeBranch,
  faImage
} from '@fortawesome/free-solid-svg-icons';
import { useAppStore } from '../store';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { metadata } = useAppStore();

  // 初始化时检查系统主题偏好
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // 切换深色/浅色模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // 导航处理
  const handleNavigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faChartSimple} 
                className="text-primary-500 text-2xl mr-2" 
              />
              <span className="font-serif text-xl font-bold">{metadata.appName}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label={darkMode ? '切换到浅色模式' : '切换到深色模式'}
              >
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside className={`w-64 bg-white dark:bg-gray-800 shadow-md transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 pt-16 h-full z-10`}>
          <div className="px-4 py-6">
            <nav>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="#home" 
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faHome} className="w-5 h-5 mr-3" />
                    <span>首页</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#logic-models" 
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faDiagramProject} className="w-5 h-5 mr-3" />
                    <span>逻辑模型设计</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#visual-models" 
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faImage} className="w-5 h-5 mr-3" />
                    <span>视觉逻辑模型图</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#third-party-models" 
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faFileImport} className="w-5 h-5 mr-3" />
                    <span>第三方数据模型</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#mapping-config" 
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faCodeBranch} className="w-5 h-5 mr-3" />
                    <span>映射配置</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* 侧边栏切换按钮 */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed top-4 left-4 z-20 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md transition-transform duration-300 ${isSidebarOpen ? 'transform translate-x-64' : ''}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            )}
          </svg>
        </button>

        {/* 主要内容区域 */}
        <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 