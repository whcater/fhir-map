import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import LogicModelPage from './pages/LogicModelPage'
import VisualModelPage from './pages/VisualModelPage'
import ThirdPartyModelPage from './pages/ThirdPartyModelPage'
import MappingConfigPage from './pages/MappingConfigPage'
import { isVSCodeEnvironment } from './utils/environment'
import { useTheme } from './hooks/useTheme'
import useAceEnvironment from './hooks/useAceEnvironment'
import './index.css'
import './styles/theme.css'

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home')
  const { theme, isDarkTheme } = useTheme()

  // 初始化时检查URL哈希值
  useEffect(() => {
    const hash = window.location.hash.slice(1) || 'home'
    setCurrentPage(hash)

    // 添加全局导航监听
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home'
      setCurrentPage(hash)
    }

    window.addEventListener('hashchange', handleHashChange)
    
    // 清理监听器
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  // 应用主题
  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast')
    document.documentElement.classList.add(`theme-${theme}`)
    
    // 为body添加环境标记类，便于CSS选择器针对不同环境应用样式
    document.body.classList.toggle('vscode-env', isVSCodeEnvironment())
    document.body.classList.toggle('web-env', !isVSCodeEnvironment())
  }, [theme])

  // 初始化Ace编辑器环境
  useAceEnvironment()

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />
      case 'logic-models':
        return <LogicModelPage />
      case 'visual-models':
        return <VisualModelPage />
      case 'third-party-models':
        return <ThirdPartyModelPage />
      case 'mapping-config':
        return <MappingConfigPage />
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className={`app-container ${isDarkTheme ? 'dark' : 'light'}`}>
      {/* 环境指示器（仅开发模式显示） */}
      {import.meta.env.DEV && (
        <div className="environment-indicator">
          {isVSCodeEnvironment() ? 'VS Code 环境' : 'Web 环境'}
        </div>
      )}
      {renderPage()}
    </div>
  )
}

export default App
