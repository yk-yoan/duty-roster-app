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
import MyDuties from "./pages/MyDuties";
import AdminHopes from "./pages/AdminHopes";
import Exchange from "./pages/Exchange"; // ★ 追加

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
          {/* ログイン */}
          <Route path="/login" element={<Login />} />

          {/* ホーム */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />

          {/* ユーザー選択 */}
          <Route
            path="/select-user"
            element={
              <ProtectedRoute>
                <SelectUser />
              </ProtectedRoute>
            }
          />

          {/* 当直希望入力 */}
          <Route
            path="/entry"
            element={
              <ProtectedRoute>
                <Entry />
              </ProtectedRoute>
            }
          />

          {/* My日当直 */}
          <Route
            path="/my-duties"
            element={
              <ProtectedRoute>
                <MyDuties />
              </ProtectedRoute>
            }
          />

          {/* 日当直交換 */}
          <Route
            path="/exchange"
            element={
              <ProtectedRoute>
                <Exchange />
              </ProtectedRoute>
            }
          />

          {/* 管理者：当直表作成 */}
          <Route
            path="/admin/assign"
            element={
              <ProtectedRoute adminOnly>
                <AdminAssign />
              </ProtectedRoute>
            }
          />

          {/* 管理者：医師管理 */}
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute adminOnly>
                <AdminDoctors />
              </ProtectedRoute>
            }
          />

          {/* 管理者：みんなの希望 */}
          <Route
            path="/admin/hopes"
            element={
              <ProtectedRoute adminOnly>
                <AdminHopes />
              </ProtectedRoute>
            }
          />

          {/* 当直表閲覧（共通） */}
          <Route
            path="/roster/:month"
            element={
              <ProtectedRoute>
                <Roster />
              </ProtectedRoute>
            }
          />

          {/* 不明なパスはリダイレクト */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </SelectedDoctorProvider>
    </AuthProvider>
  );
}

export default App;
