import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Index() {
  const { user, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">ホームメニュー</h1>
        <p className="text-gray-600 text-sm">
          ログイン中: <span className="font-semibold">{user?.email}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* 当直希望入力 */}
        <button
          onClick={() => navigate("/select-user")}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          当直希望入力
        </button>

        {/* 当直表閲覧 */}
        <button
          onClick={() => navigate("/roster/2024-06")}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          当直表閲覧
        </button>

        {/* 管理者メニュー */}
        {role === "admin" && (
          <>
            <button
              onClick={() => navigate("/admin/assign")}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              当直表作成
            </button>
            <button
              onClick={() => navigate("/admin/doctors")}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              医師管理
            </button>
          </>
        )}

        {/* ログアウト */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}

export default Index;
