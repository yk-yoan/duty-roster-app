import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

function Roster() {
  const navigate = useNavigate();
  const [month, setMonth] = useState("");
  const [assignments, setAssignments] = useState<
    Record<string, { dayDuty: string[]; nightDuty: string[] }>
  >({});
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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
      return { date: dateStr, weekday: weekDay, dayOfWeek: dateObj.getDay() };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const doctorsSnap = await getDocs(collection(db, "doctors"));
      const doctorsList = doctorsSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setDoctors(doctorsList);

      const assignRef = doc(db, "assignments", month?.replace("-", "") || "");
      const assignSnap = await getDoc(assignRef);
      if (assignSnap.exists()) {
        setAssignments(assignSnap.data().entries || {});
      } else {
        setAssignments({});
      }

      try {
        const res = await fetch("https://holidays-jp.github.io/api/v1/date.json");
        const data = await res.json();
        setHolidays(data);
      } catch (err) {
        console.error("祝日の取得に失敗しました", err);
      }

      setLoading(false);
    };

    if (month) {
      fetchData();
    }
  }, [month]);

  if (!month) return <div className="mt-10 text-center">月を選択してください。</div>;
  if (loading) return <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700">読み込み中...</p>
      </div>
    </div>

  const daysInMonth = getDaysInMonth(month);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 space-y-4">
      <button
        onClick={() => navigate("/")}
        className="mb-4 p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
      >
        ← ホームに戻る
      </button>

      <h1 className="text-2xl font-bold">{month.replace("-", "年")}の当直表</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2">月を選択:</label>
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
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border p-2">日付</th>
            <th className="border p-2">日直</th>
            <th className="border p-2">当直</th>
          </tr>
        </thead>
        <tbody>
          {daysInMonth.map(({ date, weekday, dayOfWeek }) => {
            let rowClass = "";
            if (holidays[date] || dayOfWeek === 0) {
              rowClass = "bg-red-50";
            } else if (dayOfWeek === 6) {
              rowClass = "bg-blue-50";
            }

            return (
              <tr key={date} className={`${rowClass} align-top`}>
                <td className="border p-2">
                  {date} ({weekday}){holidays[date] ? ` (${holidays[date]})` : ""}
                </td>
                <td className="border p-2">
                  {(assignments[date]?.dayDuty || [])
                    .map(
                      (id) => doctors.find((d) => d.id === id)?.name || "(不明)"
                    )
                    .join("、") || "未設定"}
                </td>
                <td className="border p-2">
                  {(assignments[date]?.nightDuty || [])
                    .map(
                      (id) => doctors.find((d) => d.id === id)?.name || "(不明)"
                    )
                    .join("、") || "未設定"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Roster;
