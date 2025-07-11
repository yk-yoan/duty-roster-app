import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

type LogEntry = {
  mode: "exchange" | "transfer";
  fromDoctorId: string;
  toDoctorId: string;
  myDate?: string;
  myType?: "日直" | "当直";
  targetDate?: string;
  targetType?: "日直" | "当直";
  date?: string; // transfer用
  type?: "日直" | "当直"; // transfer用
  timestamp: string;
};

type Doctor = {
  id: string;
  name: string;
};

function ExchangeLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [doctorsMap, setDoctorsMap] = useState<Record<string, string>>({});
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      const snapshot = await getDocs(collection(db, "doctors"));
      const map: Record<string, string> = {};
      snapshot.forEach((doc) => {
        map[doc.id] = doc.data().name;
      });
      setDoctorsMap(map);
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "exchangeLogs"));
      const selectedPrefix = selectedMonth;

      const filteredLogs: LogEntry[] = snapshot.docs
        .map((doc) => doc.data() as LogEntry)
        .filter((log) => {
          const dateStr = log.mode === "transfer" ? log.date : log.myDate;
          return dateStr?.startsWith(selectedPrefix);
        })
        .sort((a, b) => {
          const ta = parseISO(a.timestamp);
          const tb = parseISO(b.timestamp);
          return tb.getTime() - ta.getTime();
        });

      setLogs(filteredLogs);
      setLoading(false);
    };

    fetchLogs();
  }, [selectedMonth]);

  const formatDate = (iso: string) =>
    format(parseISO(iso), "yyyy/MM/dd（E）", { locale: ja });

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">交換・譲渡ログ</h1>

      <div className="mb-4">
        <label className="font-medium mr-2">表示する月:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border p-1 rounded"
        />
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : logs.length === 0 ? (
        <p>ログがありません。</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log, i) => {
            const from = doctorsMap[log.fromDoctorId] || "不明";
            const to = doctorsMap[log.toDoctorId] || "不明";

            return (
              <div key={i} className="border p-3 rounded bg-gray-50">
                {log.mode === "exchange" ? (
                  <>
                    <p>
                      <span className="font-medium">交換</span>（{formatDate(log.timestamp)}）
                    </p>
                    <p className="text-sm">
                      {from} の {formatDate(log.myDate!)}（{log.myType}） ⇄ {to} の{" "}
                      {formatDate(log.targetDate!)}（{log.targetType}）
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <span className="font-medium">譲渡</span>（{formatDate(log.timestamp)}）
                    </p>
                    <p className="text-sm">
                      {from} → {to}：{formatDate(log.date!)}（{log.type}）
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ExchangeLogs;
