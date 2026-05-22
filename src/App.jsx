import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import LoginPortal from "./pages/LoginPortal";
import Register from "./pages/Register";
import Login from "./pages/Login";
import About from "./pages/About";
import Rules from "./pages/Rules";
import Donate from "./pages/Donate";

import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import NonUbian from "./pages/NonUbian";
import Staff from "./pages/Staff";
import Developers from "./pages/Developers";
import Bideshi from "./pages/bideshi"; // ✅ PascalCase alias
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/portal" element={<LoginPortal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/developers" element={<Developers />} />

        {/* Pages */}
        <Route path="/rules" element={<Rules />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/non-ubian" element={<NonUbian />} />
        <Route path="/bideshi" element={<Bideshi />} /> {/* ✅ Added route */}

        {/* Staff Route - Public */}
        <Route path="/staff" element={<Staff />} />

        {/* Protected Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;