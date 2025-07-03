import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { HOPE_OPTIONS } from "../constants";

function Entry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctorName, setDoctorName] = useState<string>("");
  const [entries, setEntries] = useState<Record<string, string>>({});
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

  const getDaysInMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const lastDay = new Date(Number(year), Number(monthNum), 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => {
      const day = (i + 1).toString().padStart(2, "0");
      const dateStr = `${month}-${day}`;
      const dateObj = new Date(`${month}-${day}`);
      const weekDay = ["日", "月", "火", "水", "木", "金", "土"][
        dateObj.getDay()
      ];
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
      if (!id || !month) return;
      setLoading(true);

      const doctorRef = doc(db, "doctors", id);
      const doctorSnap = await getDoc(doctorRef);
      if (doctorSnap.exists()) {
        setDoctorName(doctorSnap.data().name || "");
      } else {
        setDoctorName("");
      }

      const hopeRef = doc(db, "hopes", `${id}_${month}`);
      const hopeSnap = await getDoc(hopeRef);
      if (hopeSnap.exists()) {
        setEntries(hopeSnap.data().entries || {});
      } else {
        setEntries({});
      }

      setLoading(false);
    };
    fetchData();
  }, [id, month]);

  const handleChange = (date: string, value: string) => {
    setEntries((prev) => ({ ...prev, [date]: value }));
  };

  const handleSave = async () => {
    if (!id) return;
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
    return (
      <div className="max-w-2xl mx-auto mt-10 p-4 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6">
      {/* 上部固定バー */}
      <div className="sticky top-0 z-10 bg-white border-b py-3 flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          ← ホームに戻る
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`p-2 text-white rounded text-sm ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      <h1 className="text-2xl font-bold">
        {doctorName ? `${doctorName}の当直希望入力` : "当直希望入力"}
      </h1>

      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">月を選択:</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="p-2 border rounded"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">日付</th>
              <th className="border p-2 text-left">希望</th>
            </tr>
          </thead>
          <tbody>
            {daysInMonth.map(({ date, weekday, dayOfWeek }) => {
              let rowClass = "";
              if (dayOfWeek === 0) {
                rowClass = "bg-red-50";
              } else if (dayOfWeek === 6) {
                rowClass = "bg-blue-50";
              }
              return (
                <tr key={date} className={rowClass}>
                  <td className="border p-2">
                    {date} ({weekday})
                  </td>
                  <td className="border p-2">
                    <select
                      value={entries[date] || "指定なし"}
                      onChange={(e) => handleChange(date, e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      {HOPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Entry;
