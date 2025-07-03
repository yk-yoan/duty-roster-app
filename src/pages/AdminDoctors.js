import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
function AdminDoctors() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [newName, setNewName] = useState("");
    const [newYear, setNewYear] = useState("");
    const fetchDoctors = async () => {
        const querySnapshot = await getDocs(collection(db, "doctors"));
        const docs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name || "",
            year: doc.data().year || "",
        }));
        setDoctors(docs);
    };
    useEffect(() => {
        fetchDoctors();
    }, []);
    const handleAdd = async () => {
        if (!newName || !newYear) {
            alert("名前と年次を入力してください");
            return;
        }
        await addDoc(collection(db, "doctors"), {
            name: newName,
            year: newYear,
        });
        setNewName("");
        setNewYear("");
        fetchDoctors();
    };
    const handleDelete = async (id) => {
        if (confirm("削除しますか？")) {
            await deleteDoc(doc(db, "doctors", id));
            fetchDoctors();
        }
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-4", children: [_jsx("button", { onClick: () => navigate("/"), className: "mb-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm", children: "\u2190 \u30DB\u30FC\u30E0\u306B\u623B\u308B" }), _jsx("h1", { className: "text-2xl font-bold mb-4", children: "\u533B\u5E2B\u7BA1\u7406" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsx("input", { type: "text", placeholder: "\u540D\u524D", value: newName, onChange: (e) => setNewName(e.target.value), className: "flex-1 p-2 border rounded" }), _jsx("input", { type: "text", placeholder: "\u5E74\u6B21 (\u4F8B: 1\u5E74\u76EE)", value: newYear, onChange: (e) => setNewYear(e.target.value), className: "flex-1 p-2 border rounded" }), _jsx("button", { onClick: handleAdd, className: "px-4 py-2 bg-blue-500 text-white rounded", children: "\u8FFD\u52A0" })] }), _jsx("ul", { className: "space-y-2", children: doctors.map((doctor) => (_jsxs("li", { className: "flex justify-between items-center border p-2 rounded", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: doctor.name }), _jsx("p", { className: "text-sm text-gray-600", children: doctor.year })] }), _jsx("button", { onClick: () => handleDelete(doctor.id), className: "px-2 py-1 bg-red-500 text-white rounded text-sm", children: "\u524A\u9664" })] }, doctor.id))) })] }));
}
export default AdminDoctors;
