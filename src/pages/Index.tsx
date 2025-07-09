import { useContext } from "react";
import { SelectedDoctorContext } from "../contexts/SelectedDoctorContext";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { AuthContext } from "../contexts/AuthContext";

function Index() {
  const { selectedDoctor, setSelectedDoctor } = useContext(SelectedDoctorContext);
  const { role, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center mt-10">読み込み中...</div>;
  }

  if (role === "user" && !selectedDoctor) {
    return <Navigate to="/select-user" />;
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleSwitchUser = () => {
    setSelectedDoctor(null);
    navigate("/select-user");
  };

  const now = new Date();
  const monthParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="max-w-md mx-auto mt-10 p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-4">ホームメニュー</h1>

      {role === "admin" && (
        <>
          <h2 className="text-lg font-semibold text-gray-700">管理者メニュー</h2>
          <div className="space-y-3">
            <Link
              to="/admin/assign"
              className="block p-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-center"
            >
              当直表作成
            </Link>

            <Link
              to="/admin/hopes"
              className="block p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-center"
            >
              みんなの日当直希望
            </Link>

            <Link
              to="/admin/doctors"
              className="block p-3 bg-green-600 hover:bg-green-700 text-white rounded text-center"
            >
              医師管理
            </Link>

            <Link
              to={`/roster/${monthParam}`}
              className="block p-3 bg-purple-600 hover:bg-purple-700 text-white rounded text-center"
            >
              当直表閲覧
            </Link>
          </div>

          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full p-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
            >
              ログアウト
            </button>
          </div>
        </>
      )}

      {role === "user" && selectedDoctor && (
        <>
          <h2 className="text-lg font-semibold text-gray-700">利用者メニュー</h2>
          <p className="text-sm text-gray-600 mb-2">
            選択中のユーザー: <span className="font-medium">{selectedDoctor.name}</span>
          </p>

          <div className="space-y-3">
            <Link
              to="/entry"
              className="block p-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-center"
            >
              当直希望入力
            </Link>

            <Link
              to={`/roster/${monthParam}`}
              className="block p-3 bg-green-600 hover:bg-green-700 text-white rounded text-center"
            >
              当直表閲覧
            </Link>

            <Link
              to="/my-duties"
              className="block p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-center"
            >
              My日当直
            </Link>

            <button
              onClick={() => navigate("/exchange")}
              className="w-full p-3 bg-pink-500 hover:bg-pink-600 text-white rounded text-center"
            >
              日当直交換
            </button>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={handleSwitchUser}
              className="w-full p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              ユーザー切り替え
            </button>

            <button
              onClick={handleLogout}
              className="w-full p-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
            >
              ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Index;
