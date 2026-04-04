import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Leads from './pages/Leads';
import Attendance from './pages/Attendance';
import Sales from './pages/Sales';
import Calls from './pages/Calls';
import Incentives from './pages/Incentives';
import Permission from './pages/Permission';
import Settings from './pages/Settings';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

    return <DashboardLayout>{children}</DashboardLayout>;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
                    <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                    <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
                    <Route path="/calls" element={<ProtectedRoute><Calls /></ProtectedRoute>} />
                    <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
                    <Route path="/incentives" element={<ProtectedRoute><Incentives /></ProtectedRoute>} />
                    <Route path="/permission" element={<ProtectedRoute><Permission /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
