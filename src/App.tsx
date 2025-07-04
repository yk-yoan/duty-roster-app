import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { SelectedDoctorProvider } from "./contexts/SelectedDoctorContext";
import { JSX, useContext } from "react";

import Login from "./pages/Login";
import Index from "./pages/Index";
import SelectUser from "./pages/SelectUser";
import Entry from "./pages/Entry";
import AdminAssign from "./pages/AdminAssign";
import AdminDoctors from "./pages/AdminDoctors";
import Roster from "./pages/Roster";
import MyDuties from "./pages/MyDuties"; // ← 追加

const ProtectedRoute = ({
  children,
  adminOnly = false,
}: {
  children: JSX.Element;
  adminOnly?: boolean;
}) => {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && role !== "admin") return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SelectedDoctorProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/select-user"
            element={
              <ProtectedRoute>
                <SelectUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/entry"
            element={
              <ProtectedRoute>
                <Entry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assign"
            element={
              <ProtectedRoute adminOnly>
                <AdminAssign />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute adminOnly>
                <AdminDoctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roster/:month"
            element={
              <ProtectedRoute>
                <Roster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-duties"
            element={
              <ProtectedRoute>
                <MyDuties />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </SelectedDoctorProvider>
    </AuthProvider>
  );
}

export default App;
