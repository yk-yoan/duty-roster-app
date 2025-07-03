import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useContext } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "../contexts/AuthContext";
function SelectUser() {
    const { user } = useContext(AuthContext);
    const [doctors, setDoctors] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchDoctors = async () => {
            const querySnapshot = await getDocs(collection(db, "doctors"));
            const docs = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
            }));
            setDoctors(docs);
        };
        fetchDoctors();
    }, []);
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };
    const handleSelect = (doctorId) => {
        navigate(`/entry/${doctorId}`);
    };
    return (_jsxs("div", { className: "max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow space-y-6", children: [_jsx("button", { onClick: () => navigate("/"), className: "px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm", children: "\u2190 \u30DB\u30FC\u30E0\u306B\u623B\u308B" }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "\u30E6\u30FC\u30B6\u30FC\u9078\u629E" }), _jsx("button", { onClick: handleLogout, className: "px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded", children: "\u30ED\u30B0\u30A2\u30A6\u30C8" })] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["\u30ED\u30B0\u30A4\u30F3\u4E2D: ", _jsx("span", { className: "font-medium", children: user?.email })] }), _jsx("ul", { className: "space-y-3", children: doctors.map((doctor) => (_jsx("li", { children: _jsxs("button", { onClick: () => handleSelect(doctor.id), className: "w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded transition duration-200", children: [doctor.name, "\u3092\u9078\u629E"] }) }, doctor.id))) })] }));
}
export default SelectUser;
