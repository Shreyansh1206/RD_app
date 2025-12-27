import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import SchoolSelector from './components/schoolSelecter';
import SchoolDashboard from './components/schoolDashboard';
import Navbar from './components/navbar';
import AddSchool from './components/addSchool';
import EditSchool from './components/editSchool';
import SchoolList from './components/schoolList';
import AddUniform from './components/addUniform';
import EditUniform from './components/editUniform';

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div className = "main-content" style={{ paddingTop: '20px' }}>
        <Routes>
          <Route path="/" element={<SchoolSelector />} />
          <Route path="/school" element={<SchoolList />} />
          <Route path="/school/:schoolId" element={<SchoolDashboard />} />
          <Route path="/school/new-school" element={<AddSchool />} />
          <Route path="/school/:schoolId/edit" element={<EditSchool />} />
          <Route path="/uniform/new-uniform" element={<AddUniform />} />
          <Route path="/uniform/:id/edit" element={<EditUniform />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;