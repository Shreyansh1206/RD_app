import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import './App.css';

// --- AUTH & SECURITY IMPORTS ---
import { AuthProvider, useAuth } from './context/authContext';
import { AlertProvider } from './context/alertContext';
import AlertPopUp from './components/alertPopUp';
import ProtectedRoute from './components/protectedRoute';
import Login from './components/login';

// --- COMPONENT IMPORTS ---
import HomePage from './components/homePage'; // Importing the new Home/Stats page
import SchoolDashboard from './components/schoolDashboard';
import Navbar from './components/navbar';
import AddSchool from './components/addSchool';
import EditSchool from './components/editSchool';
import SchoolList from './components/schoolList';
import AddUniform from './components/addUniform';
import EditUniform from './components/editUniform';
import Sidebar from './components/sidebar';
import AddBasePricing from './components/addBasePricing';
import BasePricingList from './components/basePricingList';
import EditBasePricing from './components/editBasePricing';
import NotFound from './components/notFound';

// 1. Root Controller
// Handles the '/' path behavior
// 1. Root Controller
// Handles the '/' path behavior
const RootRoute = () => {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/home";

  // If Logged In: Go to original destination or /home
  // If Logged Out: Show Login Page
  return user ? <Navigate to={from} replace /> : <Login />;
};

// 2. Dashboard Layout Component
// Wraps ONLY the authenticated dashboard pages
const DashboardLayout = () => {
  return (
    <>
      <Navbar />
      {/* Layout Container: Fixed height, no window scroll */}
      <div style={{ display: 'flex', height: 'calc(100vh - 6rem)', overflow: 'hidden' }}>
        <Sidebar />
        <main className="main-content" style={{ 
          flex: 1, 
          marginLeft: '260px', 
          paddingTop: '0px', 
          width: '100%',
          /* Internal Scrolling Logic */
          height: '100%', 
          overflowY: 'auto', 
        }}>
          <Outlet />
        </main>
      </div>
    </>
  );
};

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <BrowserRouter>
          <AlertPopUp />
          <Routes>
          
          {/* --- ROOT PATH (Login / Redirect) --- */}
          {/* No Layout here, so Login is full screen */}
          <Route path="/" element={<RootRoute />} />

          {/* Safety Redirect for legacy login path */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* --- PROTECTED ROUTES --- */}
          <Route element={<ProtectedRoute />}>
             {/* Nest Dashboard Routes inside the Layout */}
             <Route element={<DashboardLayout />}>
              
                {/* New Home/Landing Page */}
                <Route path="/home" element={<HomePage />} />

                {/* School Management */}
                <Route path="/school" element={<SchoolList />} />
                <Route path="/school/:schoolId" element={<SchoolDashboard />} />
                <Route path="/school/new-school" element={<AddSchool />} />
                <Route path="/school/:schoolId/edit" element={<EditSchool />} />
                
                {/* Uniform Management */}
                <Route path="/uniform/new-uniform" element={<AddUniform />} />
                <Route path="/uniform/:id/edit" element={<EditUniform />} />
                
                {/* Pricing Management */}
                <Route path="/basePricing/new-basePricing" element={<AddBasePricing />} />
                <Route path="/basePricing" element={<BasePricingList />} />
                <Route path="/basePricing/:basePricingId/edit" element={<EditBasePricing />} />
            
             </Route>
          </Route>

          {/* --- 404 CATCH ALL --- */}
          {/* Outside DashboardLayout, so no Sidebar/Navbar */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </AlertProvider>
  );
}

export default App;