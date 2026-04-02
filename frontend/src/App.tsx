import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Examinations from './pages/Examinations';
import MarksEntry from './pages/MarksEntry';
import Performance from './pages/Performance';
import ParentReport from './pages/ParentReport';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="students" element={<Students />} />
          <Route path="examinations" element={<Examinations />} />
          <Route path="marks" element={<MarksEntry />} />
          <Route path="performance/:studentId" element={<Performance />} />
          <Route path="report/:studentId" element={<ParentReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}