import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import UserBooks from './UserBooks.jsx';
import AuthForm from './AuthForm.jsx';
import AllBooks from './AllBooks.jsx';
import WaitingScreen from './Loading.jsx';
import TestsAndQuizzes from './TestsAndQuizzes.jsx';
import Profiles from './Profiles.jsx';
import AiAssistantChat from './AiAssistantChat.jsx';

// Simple placeholders for secondary pages
const Profile = () => <div className="p-4 text-2xl font-bold">Profile Settings</div>;
const Explore = () => <div className="p-4 text-2xl font-bold">Explore Content</div>;
const Tests = () => <div className="p-4 text-2xl font-bold">Quizzes & Tests</div>;

function App() {
  return (
    <AuthProvider>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<AuthForm />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard/books" replace />} />
              <Route path="books" element={<UserBooks />} />
              <Route path="explore" element={<AllBooks />} />
              <Route path="tests" element={<TestsAndQuizzes />} />
              <Route path="profile" element={<Profiles />} />
              <Route path="learn" element={<AiAssistantChat />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard/books" replace />} />
        </Routes>
    </AuthProvider>
  );
}

export default App;