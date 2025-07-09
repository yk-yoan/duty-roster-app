import { useState, useEffect, useContext } from "react";
import { useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { SelectedDoctorContext } from "../contexts/SelectedDoctorContext";
import { useNavigate } from "react-router-dom";

function Exchange() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { selectedDoctor } = useContext(SelectedDoctorContext);
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

  const navigate = useNavigate();

  const formatDateWithDay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${dateStr}（${date.toLocaleDateString("ja-JP", { weekday: "short" })}）`;
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
    if (!selectedDoctor) return;
    const months = new Set<string>();
    const doctorIds = new Set<string>([selectedDoctor.id]);
    const selectedMonth = new Date().toISOString().slice(0, 7);
    doctorIds.forEach((id) => {
      months.add(`${id}_${selectedMonth}`);
    });

    const allHopes: any = {};
    const hopesCollection = collection(db, "hopes");
    const snapshot = await getDocs(hopesCollection);

    snapshot.forEach((docSnap) => {
      const docId = docSnap.id;
      const data = docSnap.data();
      if (data?.entries) {
        allHopes[docId] = data.entries;
      }
    });
    setHopesData(allHopes);
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

  const fetchTargetDuties = async (targetId: string) => {
    const snapshot = await getDocs(collection(db, "assignments"));
    const results: { date: string; type: "日直" | "当直" }[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const entries = data.entries || {};
      Object.entries(entries).forEach(([date, duty]) => {
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
  }, [selectedDoctor]);

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
  }, [selectedDoctorId]);

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

    setLoading(true);
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

    setSelectedMyDuty("");
    setSelectedTargetDuty("");
    setSelectedDoctorId("");
    setAgreed(false);
    setLoading(false);
    setRecommendedDoctors([]);
    alert("交換が完了しました！");
  };



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

      <div>
        <p className="font-medium mb-2">交換したい自分の日当直を選択:</p>
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
          {myDuties.map((d) => {
            const value = `${d.date}|${d.type}`;
            return (
              <button
                key={value}
                onClick={() => setSelectedMyDuty(value)}
                className={`border p-2 rounded text-sm ${selectedMyDuty === value ? "bg-blue-100 border-blue-400" : ""}`}
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
                  {doc.availableDuties.map((duty) => {
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
          onChange={(e) => setSelectedDoctorId(e.target.value)}
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

      {targetDuties.length > 0 && (
        <div>
          <p className="font-medium mb-2">相手の日当直から交換候補を選択:</p>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {targetDuties.map((d) => {
              const value = `${d.date}|${d.type}`;
              return (
                <button
                  key={value}
                  onClick={() => setSelectedTargetDuty(value)}
                  className={`border p-2 rounded text-sm ${selectedTargetDuty === value ? "bg-yellow-100 border-yellow-400" : ""}`}
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
