import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Exam from './pages/Exam'
import Results from './pages/Results'
import QuestionBank from './pages/admin/QuestionBank'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exam/:subjectId" element={<Exam />} />
        <Route path="/results" element={<Results />} />
        <Route path="/admin" element={<QuestionBank />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App