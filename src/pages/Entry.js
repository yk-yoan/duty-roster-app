import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { HOPE_OPTIONS } from "../constants";
function Entry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctorName, setDoctorName] = useState("");
    const [entries, setEntries] = useState({});
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState("");
    const [saving, setSaving] = useState(false);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthOptions = [-1, 0, 1].map((diff) => {
        const date = new Date(currentYear, currentMonth - 1 + diff, 1);
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        return { value: `${y}-${m}`, label: `${y}年${m}月` };
    });
    useEffect(() => {
        if (month === "") {
            setMonth(monthOptions[1].value);
        }
    }, [monthOptions, month]);
    const getDaysInMonth = (month) => {
        const [year, monthNum] = month.split("-");
        const lastDay = new Date(Number(year), Number(monthNum), 0).getDate();
        return Array.from({ length: lastDay }, (_, i) => {
            const day = (i + 1).toString().padStart(2, "0");
            const dateStr = `${month}-${day}`;
            const dateObj = new Date(`${month}-${day}`);
            const weekDay = ["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()];
            return {
                date: dateStr,
                weekday: weekDay,
                dayOfWeek: dateObj.getDay(),
            };
        });
    };
    const daysInMonth = getDaysInMonth(month);
    useEffect(() => {
        const fetchData = async () => {
            if (!id || !month)
                return;
            setLoading(true);
            const doctorRef = doc(db, "doctors", id);
            const doctorSnap = await getDoc(doctorRef);
            if (doctorSnap.exists()) {
                setDoctorName(doctorSnap.data().name || "");
            }
            else {
                setDoctorName("");
            }
            const hopeRef = doc(db, "hopes", `${id}_${month}`);
            const hopeSnap = await getDoc(hopeRef);
            if (hopeSnap.exists()) {
                setEntries(hopeSnap.data().entries || {});
            }
            else {
                setEntries({});
            }
            setLoading(false);
        };
        fetchData();
    }, [id, month]);
    const handleChange = (date, value) => {
        setEntries((prev) => ({ ...prev, [date]: value }));
    };
    const handleSave = async () => {
        if (!id)
            return;
        setSaving(true);
        const ref = doc(db, "hopes", `${id}_${month}`);
        await setDoc(ref, {
            doctorId: id,
            month,
            entries,
            updatedAt: serverTimestamp(),
        });
        alert("保存しました！");
        setSaving(false);
    };
    if (loading || !month) {
        return (_jsx("div", { className: "max-w-2xl mx-auto mt-10 p-4 text-center", children: _jsx("p", { children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." }) }));
    }
    return (_jsxs("div", { className: "max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6", children: [_jsxs("div", { className: "sticky top-0 z-10 bg-white border-b py-3 flex justify-between items-center", children: [_jsx("button", { onClick: () => navigate("/"), className: "p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm", children: "\u2190 \u30DB\u30FC\u30E0\u306B\u623B\u308B" }), _jsx("button", { onClick: handleSave, disabled: saving, className: `p-2 text-white rounded text-sm ${saving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"}`, children: saving ? "保存中..." : "保存" })] }), _jsx("h1", { className: "text-2xl font-bold", children: doctorName ? `${doctorName}の当直希望入力` : "当直希望入力" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { className: "text-sm font-medium", children: "\u6708\u3092\u9078\u629E:" }), _jsx("select", { value: month, onChange: (e) => setMonth(e.target.value), className: "p-2 border rounded", children: monthOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full border border-gray-300 text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100", children: [_jsx("th", { className: "border p-2 text-left", children: "\u65E5\u4ED8" }), _jsx("th", { className: "border p-2 text-left", children: "\u5E0C\u671B" })] }) }), _jsx("tbody", { children: daysInMonth.map(({ date, weekday, dayOfWeek }) => {
                                let rowClass = "";
                                if (dayOfWeek === 0) {
                                    rowClass = "bg-red-50";
                                }
                                else if (dayOfWeek === 6) {
                                    rowClass = "bg-blue-50";
                                }
                                return (_jsxs("tr", { className: rowClass, children: [_jsxs("td", { className: "border p-2", children: [date, " (", weekday, ")"] }), _jsx("td", { className: "border p-2", children: _jsx("select", { value: entries[date] || "指定なし", onChange: (e) => handleChange(date, e.target.value), className: "w-full p-2 border rounded", children: HOPE_OPTIONS.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) }) })] }, date));
                            }) })] }) })] }));
}
export default Entry;
