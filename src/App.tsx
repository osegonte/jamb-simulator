import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Exam from './pages/Exam'
import Results from './pages/Results'
import Dashboard from './pages/admin/Dashboard'
import SubjectWorkspace from './pages/admin/SubjectWorkspace'

function App() {
  return (
    <BrowserRouter>
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