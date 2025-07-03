import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { useContext } from "react";
// ページインポート
import Login from "./pages/Login";
import Index from "./pages/Index";
import SelectUser from "./pages/SelectUser";
import Entry from "./pages/Entry";
import AdminAssign from "./pages/AdminAssign";
import AdminDoctors from "./pages/AdminDoctors";
import Roster from "./pages/Roster";
const ProtectedRoute = ({ children, adminOnly = false, }) => {
    const { user, role, loading } = useContext(AuthContext);
    if (loading)
        return _jsx("div", { children: "Loading..." });
    if (!user)
        return _jsx(Navigate, { to: "/login" });
    if (adminOnly && role !== "admin")
        return _jsx(Navigate, { to: "/" });
    return children;
};
function App() {
    return (_jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(Index, {}) }) }), _jsx(Route, { path: "/select-user", element: _jsx(ProtectedRoute, { children: _jsx(SelectUser, {}) }) }), _jsx(Route, { path: "/entry/:id", element: _jsx(ProtectedRoute, { children: _jsx(Entry, {}) }) }), _jsx(Route, { path: "/admin/assign", element: _jsx(ProtectedRoute, { adminOnly: true, children: _jsx(AdminAssign, {}) }) }), _jsx(Route, { path: "/admin/doctors", element: _jsx(ProtectedRoute, { adminOnly: true, children: _jsx(AdminDoctors, {}) }) }), _jsx(Route, { path: "/roster/:month", element: _jsx(ProtectedRoute, { children: _jsx(Roster, {}) }) })] }) }));
}
export default App;
