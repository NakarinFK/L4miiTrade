import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import ChartPage from './pages/ChartPage'
import JournalPage from './pages/JournalPage'
import StatsPage from './pages/StatsPage'
import AuthGate from './components/auth/AuthGate'

function App() {
  return (
    <AuthGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/chart" replace />} />
            <Route path="chart" element={<ChartPage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthGate>
  )
}

export default App
