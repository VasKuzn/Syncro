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
import GroupChatPage from './Pages/GroupChatPage';
import GroupChatsComponent from "./Components/MainPage/GroupChatsComponent";
import { CsrfProvider } from "./Contexts/CsrfProvider";
import YandexTokenHandler from "./Services/YandexTokenHandler";
import Calendar from "./Pages/Calendar";
import SteamRecommendationsPage from "./Pages/SteamRecommendationPage";


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
          <Route path="/yandex-token" element={<YandexTokenHandler />} />
          <Route path="/steamrecommendations" element={
            <ProtectedRoute>
              <SteamRecommendationsPage />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          } />

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
          <Route path="/group-chats" element={
            <ProtectedRoute>
              <GroupChatsComponent />
            </ProtectedRoute>
          } />
          <Route path="/group-chat/:groupId" element={
            <ProtectedRoute>
              <GroupChatPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </CsrfProvider>
  );
}

export default App;