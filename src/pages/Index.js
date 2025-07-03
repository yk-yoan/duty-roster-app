import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
function Index() {
    const { user, role } = useContext(AuthContext);
    const navigate = useNavigate();
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };
    return (_jsxs("div", { className: "max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "\u30DB\u30FC\u30E0\u30E1\u30CB\u30E5\u30FC" }), _jsxs("p", { className: "text-gray-600 text-sm", children: ["\u30ED\u30B0\u30A4\u30F3\u4E2D: ", _jsx("span", { className: "font-semibold", children: user?.email })] })] }), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsx("button", { onClick: () => navigate("/select-user"), className: "w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded", children: "\u5F53\u76F4\u5E0C\u671B\u5165\u529B" }), _jsx("button", { onClick: () => navigate("/roster/2024-06"), className: "w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded", children: "\u5F53\u76F4\u8868\u95B2\u89A7" }), role === "admin" && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => navigate("/admin/assign"), className: "w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded", children: "\u5F53\u76F4\u8868\u4F5C\u6210" }), _jsx("button", { onClick: () => navigate("/admin/doctors"), className: "w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded", children: "\u533B\u5E2B\u7BA1\u7406" })] })), _jsx("button", { onClick: handleLogout, className: "w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded", children: "\u30ED\u30B0\u30A2\u30A6\u30C8" })] })] }));
}
export default Index;
