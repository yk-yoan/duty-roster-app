import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
function Roster() {
    const navigate = useNavigate();
    const [month, setMonth] = useState("");
    const [assignments, setAssignments] = useState({});
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    // 月リスト（前後1ヶ月）
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthOptions = [-1, 0, 1].map((diff) => {
        const date = new Date(currentYear, currentMonth - 1 + diff, 1);
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        return { value: `${y}-${m}`, label: `${y}年${m}月` };
    });
    // 初期月を現在に
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
            return { date: dateStr, weekday: weekDay, dayOfWeek: dateObj.getDay() };
        });
    };
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // 医師一覧
            const doctorsSnap = await getDocs(collection(db, "doctors"));
            const doctorsList = doctorsSnap.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
            }));
            setDoctors(doctorsList);
            // 割当
            const assignRef = doc(db, "assignments", month?.replace("-", "") || "");
            const assignSnap = await getDoc(assignRef);
            if (assignSnap.exists()) {
                setAssignments(assignSnap.data().entries || {});
            }
            else {
                setAssignments({});
            }
            setLoading(false);
        };
        if (month) {
            fetchData();
        }
    }, [month]);
    if (!month) {
        return _jsx("div", { className: "mt-10 text-center", children: "\u6708\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002" });
    }
    if (loading) {
        return _jsx("div", { className: "mt-10 text-center", children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." });
    }
    const daysInMonth = getDaysInMonth(month);
    return (_jsxs("div", { className: "max-w-4xl mx-auto mt-10 p-4 space-y-4", children: [_jsx("button", { onClick: () => navigate("/"), className: "mb-4 p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm", children: "\u2190 \u30DB\u30FC\u30E0\u306B\u623B\u308B" }), _jsxs("h1", { className: "text-2xl font-bold", children: [month.replace("-", "年"), "\u306E\u5F53\u76F4\u8868"] }), _jsx("div", { className: "flex flex-wrap gap-4 mb-4", children: _jsxs("div", { children: [_jsx("label", { className: "mr-2", children: "\u6708\u3092\u9078\u629E:" }), _jsx("select", { value: month, onChange: (e) => setMonth(e.target.value), className: "p-2 border rounded", children: monthOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }) }), _jsxs("table", { className: "w-full border text-sm", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "border p-2", children: "\u65E5\u4ED8" }), _jsx("th", { className: "border p-2", children: "\u65E5\u76F4" }), _jsx("th", { className: "border p-2", children: "\u5F53\u76F4" })] }) }), _jsx("tbody", { children: daysInMonth.map(({ date, weekday, dayOfWeek }) => {
                            let rowClass = "";
                            if (dayOfWeek === 0)
                                rowClass = "bg-red-50";
                            else if (dayOfWeek === 6)
                                rowClass = "bg-blue-50";
                            return (_jsxs("tr", { className: `${rowClass} align-top`, children: [_jsxs("td", { className: "border p-2", children: [date, " (", weekday, ")"] }), _jsx("td", { className: "border p-2", children: (assignments[date]?.dayDuty || []).map((id) => doctors.find((d) => d.id === id)?.name || "(不明)").join("、") || "未設定" }), _jsx("td", { className: "border p-2", children: (assignments[date]?.nightDuty || []).map((id) => doctors.find((d) => d.id === id)?.name || "(不明)").join("、") || "未設定" })] }, date));
                        }) })] })] }));
}
export default Roster;
