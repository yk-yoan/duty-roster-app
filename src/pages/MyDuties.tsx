import { useEffect, useState, useContext } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../contexts/AuthContext";
import { SelectedDoctorContext } from "../contexts/SelectedDoctorContext";
import { useNavigate } from "react-router-dom";

function MyDuties() {
  const { user, loading } = useContext(AuthContext);
  const { selectedDoctor } = useContext(SelectedDoctorContext);
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<
    { date: string; type: "日直" | "当直" }[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);
  const [month, setMonth] = useState("");

  // 月選択肢
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthOptions = [-1, 0, 1].map((diff) => {
    const date = new Date(currentYear, currentMonth - 1 + diff, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return { value: `${y}-${m}`, label: `${y}年${m}月` };
  });

  // 初期月設定
  useEffect(() => {
    if (month === "") {
      setMonth(monthOptions[1].value);
    }
  }, [month, monthOptions]);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDoctor || !month) {
        return;
      }

      setLoadingData(true);

      const snapshot = await getDocs(collection(db, "assignments"));
      const results: { date: string; type: "日直" | "当直" }[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const entries = data.entries || {};
        Object.keys(entries).forEach((date) => {
          if (!date.startsWith(month)) return;
          const { dayDuty = [], nightDuty = [] } = entries[date];
          if (dayDuty.includes(selectedDoctor.id)) {
            results.push({ date, type: "日直" });
          }
          if (nightDuty.includes(selectedDoctor.id)) {
            results.push({ date, type: "当直" });
          }
        });
      });

      results.sort((a, b) => (a.date < b.date ? -1 : 1));

      setAssignments(results);
      setLoadingData(false);
    };

    fetchData();
  }, [selectedDoctor, month, navigate]);

  if (loading || loadingData || !month) {
    return (
      <div className="mt-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My日当直</h1>
        <button
          onClick={() => navigate("/")}
          className="p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          ← ホームに戻る
        </button>
      </div>

      {/* 月選択 */}
      <div className="flex items-center gap-2">
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

      {assignments.length === 0 ? (
        <p className="text-gray-700 mt-4">この月には担当がありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-300 mt-4">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2">日付</th>
                <th className="border p-2">担当区分</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(({ date, type }, idx) => {
                const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
                const week = dayOfWeek[new Date(date).getDay()];
                return (
                  <tr
                    key={`${date}-${type}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"}
                  >
                    <td className="border p-2">
                      {date} ({week})
                    </td>
                    <td className="border p-2">{type}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyDuties;
