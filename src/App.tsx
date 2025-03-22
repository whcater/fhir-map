import { useState } from 'react'
import HomePage from './pages/HomePage'
import LogicModelPage from './pages/LogicModelPage'
import VisualModelPage from './pages/VisualModelPage'
import ThirdPartyModelPage from './pages/ThirdPartyModelPage'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home')

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
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  // 添加全局导航监听
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'home'
    setCurrentPage(hash)
  })

  return (
    <>
      {renderPage()}
    </>
  )
}

export default App
