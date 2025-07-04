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
    Record<string, ("日直" | "当直")[]>
  >({});
  const [loadingData, setLoadingData] = useState(true);
  const [month, setMonth] = useState("");
  const [holidays, setHolidays] = useState<Record<string, string>>({});

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

  // 祝日取得
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch("https://holidays-jp.github.io/api/v1/date.json");
        const data = await res.json();
        setHolidays(data);
      } catch (err) {
        console.error("祝日データ取得エラー", err);
      }
    };
    fetchHolidays();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDoctor || !month) return;

      setLoadingData(true);

      const snapshot = await getDocs(collection(db, "assignments"));
      const results: Record<string, ("日直" | "当直")[]> = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const entries = data.entries || {};
        Object.keys(entries).forEach((date) => {
          if (!date.startsWith(month)) return;
          const { dayDuty = [], nightDuty = [] } = entries[date];
          const duties: ("日直" | "当直")[] = [];
          if (dayDuty.includes(selectedDoctor.id)) duties.push("日直");
          if (nightDuty.includes(selectedDoctor.id)) duties.push("当直");
          if (duties.length > 0) results[date] = duties;
        });
      });

      setAssignments(results);
      setLoadingData(false);
    };

    fetchData();
  }, [selectedDoctor, month, navigate]);

  if (loading || loadingData || !month) {
    return (
      <div className="mt-10 text-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // カレンダーの情報
  const [year, monthNumStr] = month.split("-");
  const monthNum = Number(monthNumStr);
  const firstDay = new Date(Number(year), monthNum - 1, 1);
  const lastDay = new Date(Number(year), monthNum, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  // 日付配列（先頭の空白含む）
  const days: { date?: string; duties?: ("日直" | "当直")[]; holidayName?: string; dayOfWeek?: number }[] = [];
  for (let i = 0; i < startWeekday; i++) {
    days.push({});
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    const dateObj = new Date(`${month}-${String(d).padStart(2, "0")}`);
    days.push({
      date: dateStr,
      duties: assignments[dateStr],
      holidayName: holidays[dateStr],
      dayOfWeek: dateObj.getDay(),
    });
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 space-y-6">
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

      <div className="grid grid-cols-7 border-t border-l mt-4">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div
            key={d}
            className="border-r border-b p-2 text-center font-medium bg-gray-50"
          >
            {d}
          </div>
        ))}

        {days.map((day, idx) => {
          const isHoliday = !!day.holidayName;
          const isSunday = day.dayOfWeek === 0;
          const isSaturday = day.dayOfWeek === 6;

          let bgClass = "";
          if (isHoliday || isSunday) {
            bgClass = "bg-red-50";
          } else if (isSaturday) {
            bgClass = "bg-blue-50";
          }

          return (
            <div
              key={idx}
              className={`border-r border-b p-2 h-24 align-top relative ${bgClass}`}
            >
              {day.date && (
                <>
                  <div className="text-xs font-semibold flex justify-between items-start">
                    <span>{Number(day.date.split("-")[2])}</span>
                    {day.holidayName && (
                      <span className="text-xs text-red-500 ml-1">
                        {day.holidayName}
                      </span>
                    )}
                  </div>
                  {day.duties && (
                    <div className="mt-1 space-y-1">
                      {day.duties.map((duty, i) => (
                        <div
                          key={i}
                          className={`text-xs px-1 py-0.5 rounded ${
                            duty === "日直"
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-blue-100 text-blue-800 border border-blue-300"
                          }`}
                        >
                          {duty}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyDuties;
