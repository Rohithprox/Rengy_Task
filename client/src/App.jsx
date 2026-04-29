import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Users from './pages/Users';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import PermissionViewer from './pages/PermissionViewer';
import Roles from './pages/Roles';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/teams" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/users" element={<Users />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/permissions" element={<PermissionViewer />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
