import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
export const AuthContext = createContext({
    user: null,
    role: null,
    loading: true,
});
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const ref = doc(db, "users", currentUser.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    setRole(data.role === "admin" ? "admin" : "user");
                }
                else {
                    setRole("user");
                }
            }
            else {
                setRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    return (_jsx(AuthContext.Provider, { value: { user, role, loading }, children: children }));
};
