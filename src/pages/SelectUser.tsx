import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { SelectedDoctorContext } from "../contexts/SelectedDoctorContext";

interface Doctor {
  id: string;
  name: string;
  year: string;
}

function SelectUser() {
  const { user } = useContext(AuthContext);
  const { setSelectedDoctor } = useContext(SelectedDoctorContext);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      const querySnapshot = await getDocs(collection(db, "doctors"));
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        year: doc.data().year || "未設定",
      }));
      // 年次で文字列昇順ソート
      docs.sort((a, b) => a.year.localeCompare(b.year, "ja"));
      setDoctors(docs);
      // 最初のタブは最初の年次
      setActiveYear(docs[0]?.year || "");
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    navigate("/");
  };

  if (loading) {
    return <div className="text-center mt-10">読み込み中...</div>;
  }

  // 年次リスト
  const uniqueYears = Array.from(new Set(doctors.map((d) => d.year))).sort(
    (a, b) => a.localeCompare(b, "ja")
  );

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-bold mb-4">ユーザー選択</h1>
      <p className="mb-4">ログイン中: {user?.email}</p>
      <button
        onClick={handleLogout}
        className="mb-4 p-2 bg-gray-300 hover:bg-gray-400 rounded"
      >
        ログアウト
      </button>

      {/* タブ */}
      <div className="flex flex-wrap gap-2 mb-4">
        {uniqueYears.map((year) => (
          <button
            key={year}
            onClick={() => setActiveYear(year)}
            className={`p-2 border rounded ${
              activeYear === year
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* 医師リスト */}
      <ul className="space-y-2">
        {doctors
          .filter((d) => d.year === activeYear)
          .map((doctor) => (
            <li key={doctor.id}>
              <button
                onClick={() => handleSelect(doctor)}
                className="w-full p-2 bg-blue-500 text-white rounded"
              >
                {doctor.name}
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default SelectUser;
