import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Landing from "./Pages/Landing";
import Chat from "./Pages/Chat";
import Main from "./Pages/Main";
import Settings from "./Pages/Settings";
import ResetPassword from "./Pages/ResetPassword";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/main" element={<Main />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reset_password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;