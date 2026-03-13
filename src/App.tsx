import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Exam from './pages/Exam'
import Results from './pages/Results'
import Dashboard from './pages/admin/Dashboard'
import SubjectWorkspace from './pages/admin/SubjectWorkspace'
import { useKlassSync, pullPendingKlassQuestions } from './hooks/useKlassSync'

// Mounts the KLASS Studio ↔ Jamsulator Realtime sync at the app level.
// Runs for the full lifetime of the session — no component teardown issues.
function KlassSyncProvider() {
  useKlassSync()

  useEffect(() => {
    // On mount, pull any cs_questions that arrived while Jamsulator was offline
    pullPendingKlassQuestions().then(count => {
      if (count > 0) console.log(`[KlassSyncProvider] Pulled ${count} pending questions from KLASS Studio`)
    })
  }, [])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <KlassSyncProvider />
      <Routes>
        {/* Student routes */}
        <Route path="/" element={<Home />} />
        <Route path="/exam/:subjectId" element={<Exam />} />
        <Route path="/results" element={<Results />} />

        {/* Admin routes */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/subject/:subjectId" element={<SubjectWorkspace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App