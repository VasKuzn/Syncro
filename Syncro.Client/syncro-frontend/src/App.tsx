// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Landing from "./Pages/Landing";
import Chat from "./Pages/Chat";
import Main from "./Pages/Main";
import Settings from "./Pages/Settings";
import ResetPassword from "./Pages/ResetPassword";
import ForgotPassword from "./Pages/ForgotPassword";
import ProtectedRoute from "./Components/ProtectedRoute";
import { CsrfProvider } from "./Contexts/CsrfProvider";


const App = () => {
  return (
    <CsrfProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot_password" element={<ForgotPassword />} />
          <Route path="/reset_password" element={<ResetPassword />} />
          <Route path="/main" element={
            <ProtectedRoute>
              <Main />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </CsrfProvider>
  );
}

export default App;