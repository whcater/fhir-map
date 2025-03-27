import { useState, useEffect, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSun, 
  faMoon, 
  faHome, 
  faDiagramProject, 
  faFileImport, 
  faCodeBranch,
  faImage,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import { useAppStore } from '../store';
import logoImage from '../assets/images/fhir-map-logo-64.png';

interface MainLayoutProps {
  children: ReactNode;
}

// 从localStorage获取侧边栏状态的函数
const getSavedSidebarState = (): boolean => {
  const storedState = localStorage.getItem('isSidebarOpen');
  // 如果没有保存过状态或者状态是"true"，则返回true，否则返回false
  return storedState === null ? true : storedState === 'true';
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const [darkMode, setDarkMode] = useState(false);
  // 直接从localStorage读取初始状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(getSavedSidebarState);
  const { metadata } = useAppStore();

  // 初始化时检查系统主题偏好
  useEffect(() => {
    // 检查主题偏好
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // 当侧边栏状态改变时保存到本地存储
  useEffect(() => {
    localStorage.setItem('isSidebarOpen', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // 切换深色/浅色模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // 导航处理 - 只改变URL而不改变侧边栏状态
  const handleNavigate = (path: string) => {
    // 阻止事件冒泡，确保不会触发父元素的事件处理函数
    window.location.hash = path;
  };

  // 返回首页
  const goToHome = () => {
    handleNavigate('home');
  };

  // 切换侧边栏状态
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('isSidebarOpen', String(newState));
      return newState;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 顶部导航栏 - 固定定位，确保始终在视图最顶部 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 z-20 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* 侧边栏切换按钮 - 只在小屏幕上显示 */}
              <button
                onClick={toggleSidebar}
                className="p-2 mr-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden"
                aria-label="切换侧边栏"
              >
                <FontAwesomeIcon icon={faBars} />
              </button>
              
              {/* Logo 和应用名称 - 可点击返回首页 */}
              <div className="flex items-center cursor-pointer" onClick={goToHome}>
                <img 
                  src={logoImage} 
                  alt="FHIR Map Logo" 
                  className="h-8 w-8 mr-2" 
                />
                <span className="font-serif text-xl font-bold">{metadata.appName}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 首页按钮 */}
              <button
                onClick={goToHome}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="返回首页"
              >
                <FontAwesomeIcon icon={faHome} />
              </button>
              
              {/* 切换主题按钮 */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label={darkMode ? '切换到浅色模式' : '切换到深色模式'}
              >
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16"> {/* 添加 pt-16 为顶部导航栏留出空间 */}
        {/* 侧边栏 - 收起时保留图标空间 */}
        <aside 
          className={`bg-white dark:bg-gray-800 shadow-md transform transition-all duration-300 ease-in-out fixed top-16 bottom-0 left-0 h-[calc(100vh-4rem)] z-10
            ${isSidebarOpen ? 'w-64' : 'w-16'} overflow-x-hidden`}
        >
          <div className={`py-6 ${isSidebarOpen ? 'px-4' : 'px-2'}`}>
            <nav>
              <ul className="space-y-2">
                <li>
                  <a 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate('home');
                    }}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    title="首页"
                  >
                    <FontAwesomeIcon icon={faHome} className={`${isSidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'}`} />
                    <span className={isSidebarOpen ? '' : 'hidden'}>首页</span>
                  </a>
                </li>
                <li>
                  <a 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate('logic-models');
                    }}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    title="逻辑模型设计"
                  >
                    <FontAwesomeIcon icon={faDiagramProject} className={`${isSidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'}`} />
                    <span className={isSidebarOpen ? '' : 'hidden'}>逻辑模型设计</span>
                  </a>
                </li>
                <li>
                  <a 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate('visual-models');
                    }}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    title="视觉逻辑模型图"
                  >
                    <FontAwesomeIcon icon={faImage} className={`${isSidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'}`} />
                    <span className={isSidebarOpen ? '' : 'hidden'}>视觉逻辑模型图</span>
                  </a>
                </li>
                <li>
                  <a 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate('third-party-models');
                    }}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    title="第三方数据模型"
                  >
                    <FontAwesomeIcon icon={faFileImport} className={`${isSidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'}`} />
                    <span className={isSidebarOpen ? '' : 'hidden'}>第三方数据模型</span>
                  </a>
                </li>
                <li>
                  <a 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate('mapping-config');
                    }}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    title="映射配置"
                  >
                    <FontAwesomeIcon icon={faCodeBranch} className={`${isSidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'}`} />
                    <span className={isSidebarOpen ? '' : 'hidden'}>映射配置</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* 侧边栏切换按钮 - 放在大屏幕的底部固定位置 */}
        <button
          onClick={toggleSidebar}
          className={`hidden md:flex fixed bottom-4 z-20 items-center justify-center p-2 rounded-md bg-white dark:bg-gray-800 shadow-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
            ${isSidebarOpen ? 'left-60' : 'left-12'}`}
          aria-label={isSidebarOpen ? '收起侧边栏' : '展开侧边栏'}
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

        {/* 主要内容区域 - 自动适应侧边栏宽度 */}
        <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0.5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 