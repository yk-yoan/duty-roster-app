import { useEffect, useState, useContext } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "../contexts/AuthContext";

interface Doctor {
  id: string;
  name: string;
}

function SelectUser() {
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      const querySnapshot = await getDocs(collection(db, "doctors"));
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setDoctors(docs);
    };
    fetchDoctors();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleSelect = (doctorId: string) => {
    navigate(`/entry/${doctorId}`);
  };

  return (

    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow space-y-6">
      <button
        onClick={() => navigate("/")}
        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
      >
        ← ホームに戻る
      </button>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ユーザー選択</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
        >
          ログアウト
        </button>
      </div>

      <p className="text-sm text-gray-600">
        ログイン中: <span className="font-medium">{user?.email}</span>
      </p>

      <ul className="space-y-3">
        {doctors.map((doctor) => (
          <li key={doctor.id}>
            <button
              onClick={() => handleSelect(doctor.id)}
              className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded transition duration-200"
            >
              {doctor.name}を選択
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SelectUser;
