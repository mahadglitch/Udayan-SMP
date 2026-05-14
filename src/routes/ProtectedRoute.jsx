import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion } from "framer-motion";

function ProtectedRoute({ children, requiredRole }) {
    const [status, setStatus] = useState("loading");
    const [redirectTo, setRedirectTo] = useState("/");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                setRedirectTo("/login");
                setStatus("redirect");
                return;
            }
            const snap = await getDoc(doc(db, "players", u.uid));
            if (!snap.exists()) {
                setRedirectTo("/login");
                setStatus("redirect");
                return;
            }
            const data = snap.data();

            if (data.status === "banned") {
                setRedirectTo("/login");
                setStatus("redirect");
                return;
            }

            const isAdmin = data.isAdmin === true;
            const role = isAdmin ? "admin" : "user";

            if (role === requiredRole) {
                setStatus("allowed");
            } else {
                setRedirectTo(isAdmin ? "/admin-dashboard" : "/user-dashboard");
                setStatus("redirect");
            }
        });
        return () => unsub();
    }, [requiredRole]);

    if (status === "loading") return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", background: "#060608",
            fontFamily: "'Courier New', monospace"
        }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                    width: "50px", height: "50px",
                    border: "3px solid rgba(255,111,174,0.2)",
                    borderTop: "3px solid #FF6FAE",
                    borderRadius: "50%"
                }}
            />
        </div>
    );

    if (status === "redirect") return <Navigate to={redirectTo} replace />;
    return children;
}

export default ProtectedRoute;