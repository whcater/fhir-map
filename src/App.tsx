import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './index.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold text-primary-600 mb-8">FHIR 映射逻辑模型设计器</h1>
        <p className="text-xl mb-8">
          创建中，敬请期待...
        </p>
        <div className="flex space-x-4">
          <a
            href="https://vitejs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <img src={viteLogo} className="mx-auto h-16 w-16" alt="Vite logo" />
            <p className="mt-2">Vite</p>
          </a>
          <a
            href="https://react.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <img src={reactLogo} className="mx-auto h-16 w-16" alt="React logo" />
            <p className="mt-2">React</p>
          </a>
        </div>
        <div className="mt-8">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
          >
            点击次数: {count}
          </button>
        </div>
      </div>
    </>
  )
}

export default App
