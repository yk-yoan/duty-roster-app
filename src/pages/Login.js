import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        if (!email.includes("@")) {
            setError("有効なメールアドレスを入力してください");
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError("パスワードは6文字以上にしてください");
            setLoading(false);
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "max-w-md mx-auto mt-10 p-4 border rounded shadow", children: [_jsx("h1", { className: "text-xl font-bold mb-4", children: "\u30ED\u30B0\u30A4\u30F3" }), error && _jsx("p", { className: "text-red-500", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx("input", { className: "w-full p-2 border rounded", type: "email", placeholder: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx("input", { className: "w-full p-2 border rounded", type: "password", placeholder: "\u30D1\u30B9\u30EF\u30FC\u30C9", value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsx("button", { type: "submit", className: "w-full p-2 bg-blue-500 text-white rounded", disabled: loading, children: loading ? "処理中..." : "ログイン" })] })] }));
}
export default Login;
