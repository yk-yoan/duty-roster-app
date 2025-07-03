import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

function AdminDoctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<{ id: string; name: string; year: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState("");

  const fetchDoctors = async () => {
    const querySnapshot = await getDocs(collection(db, "doctors"));
    const docs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || "",
      year: doc.data().year || "",
    }));
    setDoctors(docs);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleAdd = async () => {
    if (!newName || !newYear) {
      alert("名前と年次を入力してください");
      return;
    }
    await addDoc(collection(db, "doctors"), {
      name: newName,
      year: newYear,
    });
    setNewName("");
    setNewYear("");
    fetchDoctors();
  };

  const handleDelete = async (id: string) => {
    if (confirm("削除しますか？")) {
      await deleteDoc(doc(db, "doctors", id));
      fetchDoctors();
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-4">
      <button
        onClick={() => navigate("/")}
        className="mb-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
      >
        ← ホームに戻る
      </button>
      <h1 className="text-2xl font-bold mb-4">医師管理</h1>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="名前"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="年次 (例: 1年目)"
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          追加
        </button>
      </div>

      <ul className="space-y-2">
        {doctors.map((doctor) => (
          <li
            key={doctor.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <div>
              <p className="font-medium">{doctor.name}</p>
              <p className="text-sm text-gray-600">{doctor.year}</p>
            </div>
            <button
              onClick={() => handleDelete(doctor.id)}
              className="px-2 py-1 bg-red-500 text-white rounded text-sm"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDoctors;
