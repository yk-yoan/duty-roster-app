import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

function AdminHopes() {
  const navigate = useNavigate();
  const [month, setMonth] = useState("");
  const [doctors, setDoctors] = useState<{ id: string; name: string; year: string }[]>([]);
  const [hopes, setHopes] = useState<
    Record<string, { entries: Record<string, string>; freeComment?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

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
      const weekDay = ["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()];
      return {
        date: dateStr,
        weekday: weekDay,
      };
    });
  };

  const daysInMonth = getDaysInMonth(month);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "doctors"));
      const doctorList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        year: doc.data().year || "",
      }));

      const hopesData: Record<string, { entries: Record<string, string>; freeComment?: string }> = {};

      for (const doctor of doctorList) {
        const ref = doc(db, "hopes", `${doctor.id}_${month}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const entries = (data.entries || {}) as Record<string, string>;
          const freeComment = data.freeComment as string | undefined;
          const filtered = Object.fromEntries(
            Object.entries(entries).filter(([_, v]) => v !== "指定なし")
          );
          if (Object.keys(filtered).length > 0 || freeComment) {
            hopesData[doctor.id] = {
              entries: filtered,
              freeComment,
            };
          }
        }
      }

      setDoctors(doctorList);
      setHopes(hopesData);
      setLoading(false);

      if (doctorList.length > 0) {
        setSelectedDoctorId(doctorList[0].id);
      }
    };

    if (month) {
      fetchData();
    }
  }, [month]);

  if (loading) {
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
    <div className="max-w-4xl mx-auto mt-10 p-4 space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          ← ホームに戻る
        </button>
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

      <h1 className="text-xl font-bold">みんなの日当直希望</h1>

      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-48 border p-2 rounded bg-gray-50">
        {doctors.map((doctor) => (
          <button
            key={doctor.id}
            onClick={() => setSelectedDoctorId(doctor.id)}
            className={`px-3 py-2 border rounded text-sm font-medium transition ${
              selectedDoctorId === doctor.id
                ? "bg-blue-500 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {doctor.name} ({doctor.year})
          </button>
        ))}
      </div>

      {selectedDoctorId && hopes[selectedDoctorId] ? (
        <div className="border p-4 rounded space-y-4 bg-white shadow">
          <h2 className="text-lg font-semibold">
            {doctors.find((d) => d.id === selectedDoctorId)?.name} さんの希望
          </h2>

          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">日付</th>
                <th className="border px-2 py-1">希望</th>
              </tr>
            </thead>
            <tbody>
              {daysInMonth
                .filter((d) => hopes[selectedDoctorId].entries[d.date])
                .map((d) => (
                  <tr key={d.date}>
                    <td className="border px-2 py-1">
                      {d.date} ({d.weekday})
                    </td>
                    <td className="border px-2 py-1">
                      {hopes[selectedDoctorId].entries[d.date]}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {hopes[selectedDoctorId].freeComment && (
            <div className="mt-4 p-3 bg-gray-50 border rounded">
              <h3 className="font-medium mb-1">フリーコメント</h3>
              <p className="text-sm whitespace-pre-wrap">
                {hopes[selectedDoctorId].freeComment}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">この医師は希望を設定していません。</p>
      )}
    </div>
  );
}

export default AdminHopes;
