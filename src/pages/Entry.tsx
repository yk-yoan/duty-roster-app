// Entry.tsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { HOPE_OPTIONS } from "../constants";
import { SelectedDoctorContext } from "../contexts/SelectedDoctorContext";

function Entry() {
  const navigate = useNavigate();
  const { selectedDoctor } = useContext(SelectedDoctorContext);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [externalTraining, setExternalTraining] = useState(false);
  const [freeComment, setFreeComment] = useState("");

  useEffect(() => {
    if (!selectedDoctor) {
      navigate("/select-user");
    }
  }, [selectedDoctor]);

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
      setLoading(true);

      const ref = doc(db, "hopes", `${selectedDoctor.id}_${month}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setEntries(data.entries || {});
        setFreeComment(data.freeComment || "");
      } else {
        setEntries({});
        setFreeComment("");
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedDoctor, month]);

  const getDaysInMonth = (month: string) => {
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
        holiday: holidays[dateStr] || "",
      };
    });
  };

  const daysInMonth = getDaysInMonth(month);

  useEffect(() => {
    if (externalTraining) {
      const updatedEntries: Record<string, string> = { ...entries };

      for (let i = 0; i < daysInMonth.length; i++) {
        const { date, dayOfWeek, holiday } = daysInMonth[i];

        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holiday) {
          updatedEntries[date] = "終日不可";
          continue;
        }

        const nextDay = daysInMonth[i + 1];
        if (nextDay) {
          const nextIsWeekday = nextDay.dayOfWeek >= 1 && nextDay.dayOfWeek <= 5 && !nextDay.holiday;
          if (nextIsWeekday && (dayOfWeek === 0 || holiday)) {
            updatedEntries[date] = "当直不可";
            continue;
          }
        }

        updatedEntries[date] = "指定なし";
      }
      setEntries(updatedEntries);
    }
  }, [externalTraining, daysInMonth]);

  const handleChange = (date: string, value: string) => {
    setEntries((prev) => ({ ...prev, [date]: value }));
  };

  const handleSave = async () => {
    if (!selectedDoctor) return;
    setSaving(true);
    const ref = doc(db, "hopes", `${selectedDoctor.id}_${month}`);
    await setDoc(ref, {
      doctorId: selectedDoctor.id,
      month,
      entries,
      freeComment,
      updatedAt: serverTimestamp(),
    });
    alert("保存しました！");
    setSaving(false);
  };

  if (!selectedDoctor || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700">読み込み中...</p>
      </div>
    </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 space-y-4">
      {/* 固定ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b flex items-center justify-between p-2">
        <button
          onClick={() => navigate("/")}
          className="p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          ← ホームに戻る
        </button>
        <div className="flex items-center gap-2">
          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={externalTraining}
              onChange={() => setExternalTraining(!externalTraining)}
            />
            外病院研修
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`p-2 text-white rounded ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <h1 className="text-xl font-bold mt-4 mb-4">
        {selectedDoctor.name}の当直希望入力
      </h1>

      <div className="mb-4">
        <label>月を選択:</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="ml-2 p-1 border rounded"
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
              <th className="border p-2">日付</th>
              <th className="border p-2">希望</th>
            </tr>
          </thead>
          <tbody>
            {daysInMonth.map(({ date, weekday, dayOfWeek, holiday }) => {
              let rowClass = "";
              if (holiday || dayOfWeek === 0) {
                rowClass = "bg-red-50";
              } else if (dayOfWeek === 6) {
                rowClass = "bg-blue-50";
              }

              return (
                <tr key={date} className={rowClass}>
                  <td className="border p-2">
                    {date} ({weekday})
                    {holiday && (
                      <span className="ml-2 text-red-600 font-semibold">
                        {holiday}
                      </span>
                    )}
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

      {/* フリーコメント */}
      <div>
        <label className="block text-sm font-medium mt-4 mb-1">
          フリーコメント
        </label>
        <textarea
          value={freeComment}
          onChange={(e) => setFreeComment(e.target.value)}
          rows={4}
          className="w-full border rounded p-2"
          placeholder="自由記入欄"
        />
      </div>
    </div>
  );
}

export default Entry;
