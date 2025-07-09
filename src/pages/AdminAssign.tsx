import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

function AdminAssign() {
  const navigate = useNavigate();
  const [month, setMonth] = useState("");
  const [intervalDays, setIntervalDays] = useState(2);
  const [doctors, setDoctors] = useState<{ id: string; name: string; year: string }[]>([]);
  const [assignments, setAssignments] = useState<
    Record<string, { dayDuty: string[]; nightDuty: string[] }>
  >({});
  const [hopes, setHopes] = useState<Record<string, Record<string, string>>>({});
  const [hopesLoaded, setHopesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [holidays, setHolidays] = useState<Record<string, string>>({});

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
        console.error("祝日取得エラー", err);
      }
    };
    fetchHolidays();
  }, []);

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
      } else {
        const empty = daysInMonth.reduce((acc, d) => {
          acc[d.date] = { dayDuty: [], nightDuty: [] };
          return acc;
        }, {} as Record<string, { dayDuty: string[]; nightDuty: string[] }>);
        setAssignments(empty);
      }
    };
    if (month) {
      fetchAssignments();
    }
  }, [month]);

  useEffect(() => {
    const fetchHopes = async () => {
      const entries: Record<string, Record<string, string>> = {};
      for (const doctor of doctors) {
        const ref = doc(db, "hopes", `${doctor.id}_${month}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          entries[doctor.id] = snap.data().entries || {};
        }
      }
      setHopes(entries);
      setHopesLoaded(true);
    };
    if (doctors.length > 0 && month) {
      fetchHopes();
    }
  }, [month, doctors]);

  const toggleSelection = (
    date: string,
    type: "dayDuty" | "nightDuty",
    doctorId: string
  ) => {
    setAssignments((prev) => {
      const prevSelected = prev[date]?.[type] || [];
      if (prevSelected.includes(doctorId)) {
        return {
          ...prev,
          [date]: {
            ...(prev[date] || {}),
            [type]: prevSelected.filter((id) => id !== doctorId),
          },
        };
      }
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
    const counts: Record<string, { day: number; night: number }> = {};
    doctors.forEach((doc) => {
      counts[doc.id] = { day: 0, night: 0 };
    });
    Object.values(assignments).forEach((a) => {
      a.dayDuty.forEach((id) => {
        if (counts[id]) counts[id].day += 1;
      });
      a.nightDuty.forEach((id) => {
        if (counts[id]) counts[id].night += 1;
      });
    });
    return counts;
  };

  const counts = getCounts();

  if (loading || !month || !hopesLoaded)
    return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700">読み込み中...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6">
      <div className="sticky top-0 z-20 bg-white border-b py-2 flex flex-wrap gap-4 justify-between items-center shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/")}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            ← ホームに戻る
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            担当回数を確認
          </button>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
        >
          保存
        </button>
      </div>

      <h1 className="text-2xl font-bold">当直表作成</h1>

      <div className="flex items-center gap-4">
        <span className="font-medium">凡例:</span>
        <span className="flex items-center gap-1 text-green-600">● 当直希望</span>
        <span className="flex items-center gap-1 text-purple-600">● 日直希望</span>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2">月を選択:</label>
          <select
            value={month}
            onChange={(e) => {
            setMonth(e.target.value);
            setHopesLoaded(false);
           }}
            className="p-2 border rounded"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2">日当直の間隔(日):</label>
          <input
            type="number"
            min={0}
            max={10}
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="p-2 border rounded w-20"
          />
        </div>
      </div>

      {daysInMonth.map(({ date, weekday, dayOfWeek, holiday }) => {
        let rowClass = "";
        if (holiday) rowClass = "bg-red-50";
        else if (dayOfWeek === 0) rowClass = "bg-red-50";
        else if (dayOfWeek === 6) rowClass = "bg-blue-50";

        const dayDutySelected = assignments[date]?.dayDuty || [];
        const nightDutySelected = assignments[date]?.nightDuty || [];

        return (
          <div key={date} className={`p-4 border rounded ${rowClass}`}>
            <h2 className="text-lg font-semibold mb-2">
              {date} ({weekday})
              {holiday && (
                <span className="ml-2 text-red-500">{holiday}</span>
              )}
            </h2>

            {/* 日直 */}
            <div>
              <p className="font-medium mb-1">日直</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                {doctors.map((doctor) => {
                  const hope = hopes[doctor.id]?.[date] || "指定なし";
                  const alreadySelected = Object.keys(assignments).some((key) => {
                    if (key === date) return false;
                    const diffDays = Math.abs(
                      (new Date(date).getTime() - new Date(key).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      diffDays <= intervalDays &&
                      (
                        assignments[key]?.dayDuty?.includes(doctor.id) ||
                        assignments[key]?.nightDuty?.includes(doctor.id)
                      )
                    );
                  });

                  const disabled =
                    hope === "終日不可" ||
                    hope === "日直不可" ||
                    alreadySelected;

                  const selected = dayDutySelected.includes(doctor.id);

                  return (
                    <button
                      key={doctor.id}
                      disabled={disabled}
                      onClick={() =>
                        toggleSelection(date, "dayDuty", doctor.id)
                      }
                      className={`px-3 py-1 border rounded text-sm ${
                        selected
                          ? "bg-blue-500 text-white"
                          : "bg-white hover:bg-gray-100"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                    <span
                      className={hope === "日直希望" ? "text-purple-600" : ""}
                    >
                    {doctor.name} ({doctor.year})
                    </span>
                    </button>
                  );
                })}
              </div>
              <div className="text-sm text-gray-700 mt-1">
                選択中:{" "}
                {dayDutySelected
                  .map(
                    (id) => doctors.find((d) => d.id === id)?.name || "(不明)"
                  )
                  .join("、") || "なし"}
              </div>
            </div>

            {/* 当直 */}
            <div className="mt-4">
              <p className="font-medium mb-1">当直</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                {doctors.map((doctor) => {
                  const hope = hopes[doctor.id]?.[date] || "指定なし";
                  const alreadySelected = Object.keys(assignments).some((key) => {
                    if (key === date) return false;
                    const diffDays = Math.abs(
                      (new Date(date).getTime() - new Date(key).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      diffDays <= intervalDays &&
                      (
                        assignments[key]?.dayDuty?.includes(doctor.id) ||
                        assignments[key]?.nightDuty?.includes(doctor.id)
                      )
                    );
                  });

                  const disabled =
                    hope === "終日不可" ||
                    hope === "当直不可" ||
                    alreadySelected;

                  const selected = nightDutySelected.includes(doctor.id);

                  return (
                    <button
                      key={doctor.id}
                      disabled={disabled}
                      onClick={() =>
                        toggleSelection(date, "nightDuty", doctor.id)
                      }
                      className={`px-3 py-1 border rounded text-sm ${
                        selected
                          ? "bg-blue-500 text-white"
                          : "bg-white hover:bg-gray-100"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={
                          hope === "当直希望" ? "text-green-600" : ""
                        }
                      >
                        {doctor.name} ({doctor.year})
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="text-sm text-gray-700 mt-1">
                選択中:{" "}
                {nightDutySelected
                  .map(
                    (id) => doctors.find((d) => d.id === id)?.name || "(不明)"
                  )
                  .join("、") || "なし"}
              </div>
            </div>
          </div>
        );
      })}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded max-w-md w-full space-y-4 shadow-lg border">
            <h2 className="text-xl font-bold text-center border-b pb-2">担当回数詳細</h2>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm border border-gray-300">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1 text-left">医師（年次）</th>
                    <th className="border px-2 py-1 text-center">日直</th>
                    <th className="border px-2 py-1 text-center">当直</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors
                    .slice()
                    .sort((a, b) => {
                      const aYear = parseInt(a.year) || 999;
                      const bYear = parseInt(b.year) || 999;
                      return aYear - bYear;
                    })
                    .map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">
                          {doctor.name}（{doctor.year}）
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {counts[doctor.id].day}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {counts[doctor.id].night}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAssign;
