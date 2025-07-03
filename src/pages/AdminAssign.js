import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp, } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
function AdminAssign() {
    const navigate = useNavigate();
    const [month, setMonth] = useState("");
    const [intervalDays, setIntervalDays] = useState(2);
    const [doctors, setDoctors] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [hopes, setHopes] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
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
            return { date: dateStr, weekday: weekDay, dayOfWeek: dateObj.getDay() };
        });
    };
    const daysInMonth = getDaysInMonth(month);
    useEffect(() => {
        const fetchDoctors = async () => {
            const querySnapshot = await getDocs(collection(db, "doctors"));
            const docs = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                year: doc.data().year || "",
            }));
            setDoctors(docs);
            setLoading(false);
        };
        fetchDoctors();
    }, []);
    useEffect(() => {
        const fetchAssignments = async () => {
            const ref = doc(db, "assignments", month.replace("-", ""));
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setAssignments(snap.data().entries || {});
            }
            else {
                const empty = daysInMonth.reduce((acc, d) => {
                    acc[d.date] = { dayDuty: [], nightDuty: [] };
                    return acc;
                }, {});
                setAssignments(empty);
            }
        };
        if (month) {
            fetchAssignments();
        }
    }, [month]);
    useEffect(() => {
        const fetchHopes = async () => {
            const entries = {};
            for (const doctor of doctors) {
                const ref = doc(db, "hopes", `${doctor.id}_${month}`);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    entries[doctor.id] = snap.data().entries || {};
                }
            }
            setHopes(entries);
        };
        if (doctors.length > 0 && month) {
            fetchHopes();
        }
    }, [month, doctors]);
    const toggleSelection = (date, type, doctorId) => {
        setAssignments((prev) => {
            const prevSelected = prev[date]?.[type] || [];
            // 解除
            if (prevSelected.includes(doctorId)) {
                return {
                    ...prev,
                    [date]: {
                        ...(prev[date] || {}),
                        [type]: prevSelected.filter((id) => id !== doctorId),
                    },
                };
            }
            // 新規選択
            const newSelected = [...prevSelected, doctorId];
            if (newSelected.length > 3) {
                alert("最大3人までしか選べません");
                return prev;
            }
            return {
                ...prev,
                [date]: {
                    ...(prev[date] || {}),
                    [type]: newSelected,
                },
            };
        });
    };
    const handleSave = async () => {
        const ref = doc(db, "assignments", month.replace("-", ""));
        await setDoc(ref, {
            month,
            entries: assignments,
            updatedAt: serverTimestamp(),
        });
        alert("保存しました！");
    };
    const getCounts = () => {
        const counts = {};
        doctors.forEach((doc) => {
            counts[doc.id] = { day: 0, night: 0 };
        });
        Object.values(assignments).forEach((a) => {
            a.dayDuty.forEach((id) => {
                if (counts[id])
                    counts[id].day += 1;
            });
            a.nightDuty.forEach((id) => {
                if (counts[id])
                    counts[id].night += 1;
            });
        });
        return counts;
    };
    const counts = getCounts();
    if (loading || !month)
        return (_jsx("div", { className: "text-center mt-10", children: _jsx("p", { children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." }) }));
    return (_jsxs("div", { className: "max-w-6xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6", children: [_jsx("button", { onClick: () => navigate("/"), className: "px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm", children: "\u2190 \u30DB\u30FC\u30E0\u306B\u623B\u308B" }), _jsx("h1", { className: "text-2xl font-bold", children: "\u5F53\u76F4\u8868\u4F5C\u6210" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "font-medium", children: "\u51E1\u4F8B:" }), _jsx("span", { className: "flex items-center gap-1 text-green-600", children: "\u25CF \u5F53\u76F4\u5E0C\u671B" })] }), _jsxs("div", { className: "sticky top-0 z-10 bg-white border-b py-2 flex flex-wrap gap-4 items-center shadow-sm", children: [_jsxs("div", { children: [_jsx("label", { className: "mr-2", children: "\u6708\u3092\u9078\u629E:" }), _jsx("select", { value: month, onChange: (e) => setMonth(e.target.value), className: "p-2 border rounded", children: monthOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mr-2", children: "\u65E5\u5F53\u76F4\u306E\u9593\u9694(\u65E5):" }), _jsx("input", { type: "number", min: 0, max: 10, value: intervalDays, onChange: (e) => setIntervalDays(Number(e.target.value)), className: "p-2 border rounded w-20" })] }), _jsx("button", { onClick: () => setShowModal(true), className: "p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm", children: "\u62C5\u5F53\u56DE\u6570\u3092\u78BA\u8A8D" })] }), daysInMonth.map(({ date, weekday, dayOfWeek }) => {
                let rowClass = "";
                if (dayOfWeek === 0)
                    rowClass = "bg-red-50";
                else if (dayOfWeek === 6)
                    rowClass = "bg-blue-50";
                const dayDutySelected = assignments[date]?.dayDuty || [];
                const nightDutySelected = assignments[date]?.nightDuty || [];
                return (_jsxs("div", { className: `p-4 border rounded ${rowClass}`, children: [_jsxs("h2", { className: "text-lg font-semibold mb-2", children: [date, " (", weekday, ")"] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium mb-1", children: "\u65E5\u76F4" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded", children: doctors.map((doctor) => {
                                        const hope = hopes[doctor.id]?.[date] || "指定なし";
                                        const alreadySelected = Object.keys(assignments).some((key) => {
                                            if (key === date)
                                                return false;
                                            const diffDays = Math.abs((new Date(date).getTime() - new Date(key).getTime()) / (1000 * 60 * 60 * 24));
                                            return (diffDays <= intervalDays &&
                                                assignments[key]?.dayDuty?.includes(doctor.id));
                                        });
                                        const disabled = hope === "終日不可" ||
                                            hope === "日直不可" ||
                                            alreadySelected;
                                        const selected = dayDutySelected.includes(doctor.id);
                                        return (_jsxs("button", { disabled: disabled, onClick: () => toggleSelection(date, "dayDuty", doctor.id), className: `px-3 py-1 border rounded text-sm ${selected
                                                ? "bg-blue-500 text-white"
                                                : "bg-white hover:bg-gray-100"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: [doctor.name, " (", doctor.year, ")"] }, doctor.id));
                                    }) }), _jsxs("div", { className: "text-sm text-gray-700 mt-1", children: ["\u9078\u629E\u4E2D:", " ", dayDutySelected
                                            .map((id) => doctors.find((d) => d.id === id)?.name || "(不明)")
                                            .join("、") || "なし"] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "font-medium mb-1", children: "\u5F53\u76F4" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded", children: doctors.map((doctor) => {
                                        const hope = hopes[doctor.id]?.[date] || "指定なし";
                                        const alreadySelected = Object.keys(assignments).some((key) => {
                                            if (key === date)
                                                return false;
                                            const diffDays = Math.abs((new Date(date).getTime() - new Date(key).getTime()) / (1000 * 60 * 60 * 24));
                                            return (diffDays <= intervalDays &&
                                                assignments[key]?.nightDuty?.includes(doctor.id));
                                        });
                                        const disabled = hope === "終日不可" ||
                                            hope === "当直不可" ||
                                            alreadySelected;
                                        const selected = nightDutySelected.includes(doctor.id);
                                        return (_jsx("button", { disabled: disabled, onClick: () => toggleSelection(date, "nightDuty", doctor.id), className: `px-3 py-1 border rounded text-sm ${selected
                                                ? "bg-blue-500 text-white"
                                                : "bg-white hover:bg-gray-100"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: _jsxs("span", { className: hope === "当直希望" ? "text-green-600" : "", children: [doctor.name, " (", doctor.year, ")"] }) }, doctor.id));
                                    }) }), _jsxs("div", { className: "text-sm text-gray-700 mt-1", children: ["\u9078\u629E\u4E2D:", " ", nightDutySelected
                                            .map((id) => doctors.find((d) => d.id === id)?.name || "(不明)")
                                            .join("、") || "なし"] })] })] }, date));
            }), _jsx("button", { onClick: handleSave, className: "w-full mt-6 p-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded", children: "\u4FDD\u5B58" }), showModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white p-6 rounded max-w-md w-full space-y-4", children: [_jsx("h2", { className: "text-lg font-bold", children: "\u62C5\u5F53\u56DE\u6570\u8A73\u7D30" }), _jsx("ul", { className: "space-y-1", children: doctors.map((doctor) => (_jsxs("li", { children: [doctor.name, " (", doctor.year, "): \u65E5\u76F4 ", counts[doctor.id].day, " \u56DE / \u5F53\u76F4 ", counts[doctor.id].night, " \u56DE"] }, doctor.id))) }), _jsx("button", { onClick: () => setShowModal(false), className: "mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded", children: "\u9589\u3058\u308B" })] }) }))] }));
}
export default AdminAssign;
