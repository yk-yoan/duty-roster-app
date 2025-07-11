import { useState, useEffect, useContext, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { SelectedDoctorContext } from "../contexts/SelectedDoctorContext";
import { useNavigate } from "react-router-dom";


function Exchange() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { selectedDoctor } = useContext(SelectedDoctorContext);
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [myDuties, setMyDuties] = useState<{ date: string; type: "日直" | "当直" }[]>([]);
  const [selectedMyDuty, setSelectedMyDuty] = useState<string>("");
  const [doctors, setDoctors] = useState<{ id: string; name: string; year: string }[]>([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState<{ id: string; name: string; year: string; availableDuties: { date: string; type: "日直" | "当直" }[] }[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [targetDuties, setTargetDuties] = useState<{ date: string; type: "日直" | "当直" }[]>([]);
  const [selectedTargetDuty, setSelectedTargetDuty] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignmentsData, setAssignmentsData] = useState<any>({});
  const [hopesData, setHopesData] = useState<any>({});
  const [exchangeStatus, setExchangeStatus] = useState<"idle" | "processing" | "completed">("idle");

  const formatDateWithDay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${dateStr}（${date.toLocaleDateString("ja-JP", { weekday: "short" })}）`;
  };

  const getHopeEntry = (id: string, date: string): string | undefined => {
    const month = date.slice(0, 7);
    const docId = `${id}_${month}`;
    return hopesData[docId]?.[date];
  };

  const isUnavailable = (id: string, date: string, type: "日直" | "当直"): boolean => {
    const entry = getHopeEntry(id, date);
    return entry === "終日不可" || entry === `${type}不可`;
  };

  const isFullyUnavailable = (id: string, date: string): boolean => {
    const entry = getHopeEntry(id, date);
    return entry === "終日不可";
  };

  const fetchMyDuties = async () => {
    if (!selectedDoctor) return;
    const snapshot = await getDocs(collection(db, "assignments"));
    const results: { date: string; type: "日直" | "当直" }[] = [];
    const allAssignments: any = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const entries = data.entries || {};
      Object.entries(entries).forEach(([date, duty]) => {
        const entry = duty as { dayDuty: string[]; nightDuty: string[] };
        allAssignments[date] = entry;
        if (!date.startsWith(selectedMonth)) return;
        if (entry.dayDuty?.includes(selectedDoctor.id)) {
          results.push({ date, type: "日直" });
        }
        if (entry.nightDuty?.includes(selectedDoctor.id)) {
          results.push({ date, type: "当直" });
        }
      });
    });

    results.sort((a, b) => a.date.localeCompare(b.date));
    setMyDuties(results);
    setAssignmentsData(allAssignments);
  };

  const fetchDoctors = async () => {
    const querySnapshot = await getDocs(collection(db, "doctors"));
    const data = querySnapshot.docs
      .filter((d) => d.id !== selectedDoctor?.id)
      .map((d) => ({
        id: d.id,
        name: d.data().name,
        year: d.data().year || "",
      }));
    setDoctors(data);
  };

  const fetchHopes = async () => {
    const snapshot = await getDocs(collection(db, "hopes"));
    const allHopes: any = {};
    snapshot.forEach((docSnap) => {
      const docId = docSnap.id;
      const data = docSnap.data();
      if (data?.entries) {
        allHopes[docId] = data.entries;
      }
    });
    setHopesData(allHopes);
  };

  const fetchTargetDuties = async (targetId: string) => {
    const snapshot = await getDocs(collection(db, "assignments"));
    const results: { date: string; type: "日直" | "当直" }[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const entries = data.entries || {};
      Object.entries(entries).forEach(([date, duty]) => {
        if (!date.startsWith(selectedMonth)) return;
        const entry = duty as { dayDuty: string[]; nightDuty: string[] };
        if (entry.dayDuty?.includes(targetId)) {
          results.push({ date, type: "日直" });
        }
        if (entry.nightDuty?.includes(targetId)) {
          results.push({ date, type: "当直" });
        }
      });
    });

    results.sort((a, b) => a.date.localeCompare(b.date));
    setTargetDuties(results);
  };

  useEffect(() => {
    fetchMyDuties();
  }, [selectedDoctor, selectedMonth]);

  useEffect(() => {
    fetchDoctors();
    fetchHopes();
  }, [selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setTargetDuties([]);
      return;
    }
    fetchTargetDuties(selectedDoctorId);
  }, [selectedDoctorId, selectedMonth]);

  useEffect(() => {
    if (
      Object.keys(assignmentsData).length > 0 &&
      doctors.length > 0 &&
      Object.keys(hopesData).length > 0 &&
      myDuties.length > 0
    ) {
      setPageLoading(false);
    }
  }, [assignmentsData, doctors, hopesData, myDuties]);


  useEffect(() => {
    if (!selectedDoctor || !selectedMyDuty || !assignmentsData || !hopesData || !doctors.length) return;

    const [myDate, myType] = selectedMyDuty.split("|") as [string, "日直" | "当直"];
    const getAdjacentDates = (dateStr: string): string[] => {
      const base = new Date(dateStr);
      const prev = new Date(base);
      prev.setDate(base.getDate() - 1);
      const next = new Date(base);
      next.setDate(base.getDate() + 1);
      const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return [toStr(prev), dateStr, toStr(next)];
    };

    const isDutyAssigned = (id: string, date: string): boolean => {
      const entry = assignmentsData[date];
      return entry?.dayDuty?.includes(id) || entry?.nightDuty?.includes(id);
    };

    const availableDoctors = doctors.map((doc) => {
      const surroundingMyDates = getAdjacentDates(myDate);
      if (surroundingMyDates.some((d) => isDutyAssigned(doc.id, d))) return null;
      if (isUnavailable(doc.id, myDate, myType)) return null;

      const availableDuties: { date: string; type: "日直" | "当直" }[] = [];

      Object.entries(assignmentsData).forEach(([date, duty]) => {
        const entry = duty as { dayDuty: string[]; nightDuty: string[] };
        const surroundingDates = getAdjacentDates(date);

        if (surroundingDates.some((d) => isDutyAssigned(selectedDoctor.id, d))) return;
        if (isFullyUnavailable(selectedDoctor.id, date)) return;

        if (entry.dayDuty?.includes(doc.id) && !isUnavailable(selectedDoctor.id, date, "日直")) {
          availableDuties.push({ date, type: "日直" });
        }

        if (entry.nightDuty?.includes(doc.id) && !isUnavailable(selectedDoctor.id, date, "当直")) {
          availableDuties.push({ date, type: "当直" });
        }
      });

      if (availableDuties.length === 0) return null;

      return { ...doc, availableDuties };
    }).filter(Boolean) as any[];

    setRecommendedDoctors(availableDoctors);
  }, [selectedMyDuty, assignmentsData, hopesData, doctors, selectedDoctor]);

  const handleExchange = async () => {
  if (!selectedMyDuty || !selectedTargetDuty || !agreed || !selectedDoctor) return;

  setExchangeStatus("processing"); // ローディング状態に切り替え

  try {
    const [myDate, myType] = selectedMyDuty.split("|");
    const [targetDate, targetType] = selectedTargetDuty.split("|");

    const snapshot = await getDocs(collection(db, "assignments"));
    const batchUpdates: { docId: string; data: Record<string, any> }[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const entries = data.entries || {};
      let updated = false;

      const updateDuty = (date: string, type: "日直" | "当直", fromId: string, toId: string) => {
        if (!entries[date]) return;
        const dutyList = type === "日直" ? entries[date].dayDuty : entries[date].nightDuty;
        if (!dutyList.includes(fromId)) return;
        const idx = dutyList.indexOf(fromId);
        dutyList[idx] = toId;
        updated = true;
      };

      updateDuty(myDate, myType as "日直" | "当直", selectedDoctor.id, selectedDoctorId);
      updateDuty(targetDate, targetType as "日直" | "当直", selectedDoctorId, selectedDoctor.id);

      if (updated) {
        batchUpdates.push({ docId: docSnap.id, data: entries });
      }
    });

    for (const update of batchUpdates) {
      const docRef = doc(db, "assignments", update.docId);
      await updateDoc(docRef, { entries: update.data });
    }

    await fetchMyDuties();
    await fetchTargetDuties(selectedDoctorId);

   await addDoc(collection(db, "exchangeLogs"), {
      fromDoctorId: selectedDoctor.id,
      toDoctorId: selectedDoctorId,
      myDate,
      myType,
      targetDate,
      targetType,
      timestamp: new Date().toISOString(),
      mode: "exchange", // mode で区別
      notified: false,
    });
    // ステートリセット
    setSelectedMyDuty("");
    setSelectedTargetDuty("");
    setSelectedDoctorId("");
    setAgreed(false);

    setExchangeStatus("completed"); // 完了ステータスに
  } catch (err) {
    alert("交換中にエラーが発生しました。");
    setExchangeStatus("idle"); // リセット
  }
};

const handleTransfer = async () => {
  if (!selectedMyDuty || !selectedDoctorId || selectedTargetDuty !== "" || !selectedDoctor) return;

  setExchangeStatus("processing");
  const [date, type] = selectedMyDuty.split("|");

  try {
    const [myDate, myType] = selectedMyDuty.split("|") as [string, "日直" | "当直"];

    const snapshot = await getDocs(collection(db, "assignments"));
    const batchUpdates: { docId: string; data: Record<string, any> }[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const entries = data.entries || {};
      let updated = false;

      const updateDuty = (date: string, type: "日直" | "当直", fromId: string, toId: string) => {
        if (!entries[date]) return;
        const dutyList = type === "日直" ? entries[date].dayDuty : entries[date].nightDuty;
        if (!dutyList.includes(fromId)) return;
        const idx = dutyList.indexOf(fromId);
        dutyList[idx] = toId;
        updated = true;
      };

      updateDuty(myDate, myType, selectedDoctor.id, selectedDoctorId);

      if (updated) {
        batchUpdates.push({ docId: docSnap.id, data: entries });
      }
    });

    for (const update of batchUpdates) {
      const docRef = doc(db, "assignments", update.docId);
      await updateDoc(docRef, { entries: update.data });
    }

    await fetchMyDuties();
    await fetchTargetDuties(selectedDoctorId);
    await addDoc(collection(db, "exchangeLogs"), {
      fromDoctorId: selectedDoctor.id,
      toDoctorId: selectedDoctorId,
      date,
      type,
      timestamp: new Date().toISOString(),
      mode: "transfer",
      notified: false,
    });

    // ステートをリセット
    setSelectedMyDuty("");
    setSelectedDoctorId("");
    setSelectedTargetDuty("");
    setAgreed(false);

    setExchangeStatus("completed");
  } catch (err) {
    console.error("譲渡エラー:", err);
    alert("譲渡中にエラーが発生しました。");
    setExchangeStatus("idle");
  }
};

  if (pageLoading) {
  return (
   <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700">読み込み中...</p>
      </div>
    </div>
  );
  }
  if (exchangeStatus === "processing") {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4"></div>
        <p className="text-blue-700 text-lg font-semibold">交換処理中...</p>
      </div>
    </div>
  );
}

if (exchangeStatus === "completed") {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-4">
      <h2 className="text-xl font-bold text-green-600">交換が完了しました！</h2>
      <button
        onClick={async () => {
          setExchangeStatus("idle");

          // 状態をすべて初期化
          setSelectedMyDuty("");
          setSelectedDoctorId("");
          setSelectedTargetDuty("");
          setAgreed(false);
          setTargetDuties([]);
          setRecommendedDoctors([]);

          // データを再取得
          await fetchMyDuties();
          await fetchDoctors();
          await fetchHopes();
        }}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        戻る
      </button>
    </div>
  );
}

  return (
  <div className="max-w-3xl mx-auto p-4 space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold">日当直交換</h1>
      <button
        onClick={() => navigate("/")}
        className="p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
      >
        ← ホームに戻る
      </button>
    </div>

    <div className="mb-4">
      <label className="font-medium mr-2">表示する月:</label>
      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="border p-1 rounded"
      />
    </div>

    <div>
      <p className="font-medium mb-2">交換したい自分の日当直を選択:</p>
      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
        {myDuties.map((d) => {
          const value = `${d.date}|${d.type}`;
          return (
            <button
              key={value}
              onClick={() =>
                setSelectedMyDuty(selectedMyDuty === value ? "" : value)
              }
              className={`border p-2 rounded text-sm ${
                selectedMyDuty === value ? "bg-blue-100 border-blue-400" : ""
              }`}
            >
              {formatDateWithDay(d.date)}（{d.type}）
            </button>
          );
        })}
      </div>
    </div>

    {recommendedDoctors.length > 0 && (
      <div>
        <p className="font-medium mb-2">おすすめ交換相手:</p>
        <div className="grid grid-cols-1 gap-4">
          {recommendedDoctors.map((doc) => (
            <div key={doc.id} className="border rounded p-2 bg-yellow-50">
              <p className="font-medium">{doc.name}</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {doc.availableDuties
                  .filter((d) => d.date.startsWith(selectedMonth))
                  .map((duty) => {
                    const val = `${duty.date}|${duty.type}`;
                    return (
                      <button
                        key={val}
                        className={`border p-1 rounded text-xs bg-white hover:bg-yellow-100 ${
                          selectedTargetDuty === val ? "bg-yellow-200 border-yellow-400" : ""
                        }`}
                        onClick={() => {
                          setSelectedDoctorId(doc.id);
                          setSelectedTargetDuty(val);
                          setTimeout(() => {
                            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                          }, 0);
                        }}
                      >
                        {formatDateWithDay(duty.date)}（{duty.type}）
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    <div>
      <p className="font-medium mb-2">交換相手のユーザーを選択:</p>
      <select
        value={selectedDoctorId}
        onChange={(e) => {
          setSelectedDoctorId(e.target.value);
          if (e.target.value === "") setSelectedTargetDuty(""); // リセット
        }}
        className="w-full p-2 border rounded"
      >
        <option value="">選択してください</option>
        {doctors.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </div>

    {targetDuties
      .filter((d) => d.date.startsWith(selectedMonth))
      .length > 0 && (
      <div>
        <p className="font-medium mb-2">相手の日当直から交換候補を選択:</p>
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
          {targetDuties.map((d) => {
  const value = `${d.date}|${d.type}`;
  return (
          <button
            key={value}
            onClick={() =>
              setSelectedTargetDuty(selectedTargetDuty === value ? "" : value)
            }
            className={`border p-2 rounded text-sm ${
              selectedTargetDuty === value ? "bg-yellow-100 border-yellow-400" : ""
            }`}
          >
            {formatDateWithDay(d.date)}（{d.type}）
          </button>
        );
      })}
        </div>
      </div>
    )}

    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="agree"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
      />
      <label htmlFor="agree" className="text-sm">交換相手との承諾を得た</label>
    </div>

    {/* 譲渡ボタン（選択中の相手日程がない場合にのみ有効） */}
    <button
      onClick={() => handleTransfer()}
      disabled={!selectedMyDuty || selectedTargetDuty !== "" || !agreed}
      className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded disabled:bg-gray-300"
      >
      譲渡する
    </button>


    {/* 交換ボタン */}
    <button
      onClick={handleExchange}
      disabled={!selectedMyDuty || !selectedTargetDuty || !agreed || loading}
      className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:bg-gray-300 relative"
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white border-r-2 mr-2"></div>
          交換中...
        </div>
      ) : (
        "交換する"
      )}
    </button>

    <div ref={bottomRef}></div>
  </div>
);
}

export default Exchange;
