import type { ReactElement } from 'react'

function App(): ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HarmonyTech</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">AI-powered GTD app</p>
      </main>
    </div>
  )
}

export default App
