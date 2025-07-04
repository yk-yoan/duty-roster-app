import { useContext } from "react";
import { SelectedDoctorContext } from "../contexts/SelectedDoctorContext";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { AuthContext } from "../contexts/AuthContext";

function Index() {
  const { selectedDoctor } = useContext(SelectedDoctorContext);
  const { role, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center mt-10">読み込み中...</div>;
  }

  // userでユーザー未選択ならリダイレクト
  if (role === "user" && !selectedDoctor) {
    return <Navigate to="/select-user" />;
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // 当月を計算
  const now = new Date();
  const monthParam = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  return (
    <div className="max-w-md mx-auto mt-10 p-4 space-y-4">
      <h1 className="text-xl font-bold">ホームメニュー</h1>

      {role === "admin" && (
        <>
          <Link
            to="/admin/assign"
            className="block p-2 bg-blue-500 text-white rounded text-center"
          >
            当直表作成
          </Link>

          <Link
            to="/admin/doctors"
            className="block p-2 bg-green-500 text-white rounded text-center"
          >
            医師管理
          </Link>

          <Link
            to={`/roster/${monthParam}`}
            className="block p-2 bg-purple-500 text-white rounded text-center"
          >
            当直表閲覧
          </Link>

          <button
            onClick={handleLogout}
            className="w-full p-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            ログアウト
          </button>
        </>
      )}

      {role === "user" && selectedDoctor && (
        <>
          <p>選択中のユーザー: {selectedDoctor.name}</p>

          <Link
            to="/entry"
            className="block p-2 bg-blue-500 text-white rounded text-center"
          >
            当直希望入力
          </Link>

          <Link
            to={`/roster/${monthParam}`}
            className="block p-2 bg-green-500 text-white rounded text-center"
          >
            当直表閲覧
          </Link>

          <Link
            to="/my-duties"
            className="block p-2 bg-yellow-500 text-white rounded text-center"
          >
            My日当直
          </Link>

          <button
            onClick={handleLogout}
            className="w-full p-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            ログアウト
          </button>
        </>
      )}
    </div>
  );
}

export default Index;
