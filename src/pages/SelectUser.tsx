import { useEffect, useState, useContext } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { SelectedDoctorContext } from "../contexts/SelectedDoctorContext";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

function SelectUser() {
  const { setSelectedDoctor } = useContext(SelectedDoctorContext);
  const { user, loading, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<{ id: string; name: string; year: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchDoctors = async () => {
      const querySnapshot = await getDocs(collection(db, "doctors"));
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        year: doc.data().year || "",
      }));
      setDoctors(docs);
    };
    fetchDoctors();
  }, []);

  const handleSelect = (doctor: { id: string; name: string; year: string }) => {
    setSelectedDoctor(doctor);
    navigate("/");
  };

  // 年次の種類
  const years = Array.from(new Set(doctors.map((d) => d.year))).sort();

  if (loading) {
    return <div className="text-center mt-10">読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4">
      <h1 className="text-xl font-bold mb-4">ユーザーを選択</h1>

      {/* 年次タブ */}
      <div className="flex flex-wrap gap-2 mb-4">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-3 py-1 border rounded ${
              selectedYear === year
                ? "bg-blue-500 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {year}
          </button>
        ))}
        <button
          onClick={() => setSelectedYear(null)}
          className={`px-3 py-1 border rounded ${
            selectedYear === null
              ? "bg-blue-500 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          全て
        </button>
      </div>

      {/* ユーザー一覧 */}
      <div className="border rounded p-2 max-h-80 overflow-y-auto space-y-2">
        {doctors
          .filter((d) => !selectedYear || d.year === selectedYear)
          .map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => handleSelect(doctor)}
              className="w-full text-left p-2 border rounded hover:bg-gray-50"
            >
              {doctor.name} ({doctor.year})
            </button>
          ))}
      </div>
    </div>
  );
}

export default SelectUser;
