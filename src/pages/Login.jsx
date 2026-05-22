import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const getFriendlyError = (code) => {
    switch (code) {
        case "auth/invalid-email": return "⚠️ That email doesn't look right.";
        case "auth/user-not-found": return "❌ No account found with that email.";
        case "auth/wrong-password": return "🔒 Wrong password. Try again.";
        case "auth/invalid-credential": return "❌ Wrong email or password.";
        case "auth/too-many-requests": return "🚫 Too many attempts. Try again later.";
        case "auth/user-disabled": return "⛔ This account has been disabled.";
        default: return "😵 Something went wrong. Try again.";
    }
};

const EyeOpen = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <motion.path
            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke="#FF6FAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        />
        <motion.circle
            cx="12" cy="12" r="3" stroke="#FF6FAE" strokeWidth="2" fill="rgba(255,111,174,0.15)"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.2 }}
        />
    </svg>
);

const EyeClosed = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <motion.path
            d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
            stroke="#FF6FAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        />
        <motion.path
            d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
            stroke="#FF6FAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        />
        <motion.path
            d="M1 1l22 22" stroke="#FF6FAE" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
        />
    </svg>
);

/* ── Shared UbianModal ── */
function UbianModal({ onClose, onYes, onNo }) {
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, zIndex: 20000,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}
            >
                <motion.div
                    key="card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.5, opacity: 0, y: 60, rotateX: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: 60 }}
                    transition={{ type: "spring", damping: 18, stiffness: 260 }}
                    style={{
                        position: "relative",
                        background: "linear-gradient(135deg, rgba(20,5,20,0.97) 0%, rgba(40,10,40,0.97) 100%)",
                        border: "1.5px solid rgba(255,111,174,0.45)",
                        borderRadius: "28px",
                        padding: "3rem 2.5rem 2.5rem",
                        maxWidth: "420px", width: "90vw",
                        textAlign: "center",
                        boxShadow: "0 0 60px rgba(255,111,174,0.25), 0 0 120px rgba(255,111,174,0.1), inset 0 0 40px rgba(255,111,174,0.04)",
                        overflow: "hidden",
                        fontFamily: "'Courier New', monospace"
                    }}
                >
                    <div style={{
                        position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
                        width: "200px", height: "200px", borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,111,174,0.35) 0%, transparent 70%)",
                        pointerEvents: "none"
                    }} />

                    <style>{`
                        @keyframes shimmer {
                            0% { background-position: -200% center; }
                            100% { background-position: 200% center; }
                        }
                        @keyframes pulse-glow {
                            0%, 100% { box-shadow: 0 0 0px rgba(255,111,174,0.4); }
                            50% { box-shadow: 0 0 20px rgba(255,111,174,0.8), 0 0 40px rgba(255,111,174,0.3); }
                        }
                        @keyframes globe-glow {
                            0%, 100% { box-shadow: 0 0 0px rgba(100,200,255,0.4); }
                            50% { box-shadow: 0 0 20px rgba(100,200,255,0.8), 0 0 40px rgba(100,200,255,0.3); }
                        }
                        .ubian-yes:hover { animation: pulse-glow 1s ease infinite; }
                        .ubian-no:hover { filter: brightness(1.2); }
                        .ubian-foreigner:hover { animation: globe-glow 1s ease infinite; }
                    `}</style>

                    <motion.div
                        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            display: "inline-block",
                            background: "linear-gradient(90deg, #FF6FAE, #ff9ed2, #FF6FAE)",
                            backgroundSize: "200% auto",
                            animation: "shimmer 3s linear infinite",
                            borderRadius: "50px",
                            padding: "4px 18px",
                            fontSize: "0.65rem",
                            fontWeight: "900",
                            letterSpacing: "3px",
                            color: "#fff",
                            textTransform: "uppercase",
                            marginBottom: "1.2rem",
                            boxShadow: "0 0 14px rgba(255,111,174,0.5)"
                        }}
                    >
                        ✦ Verification ✦
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        style={{
                            fontSize: "2rem", fontWeight: "900", color: "#f5c842",
                            textShadow: "3px 3px 0 #7a5c00, 0 0 30px rgba(245,200,66,0.6)",
                            marginBottom: "0.6rem", lineHeight: 1.2
                        }}
                    >
                        Are You An Ubian?
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        style={{ color: "rgba(255,111,174,0.75)", fontSize: "0.82rem", marginBottom: "2.2rem", letterSpacing: "0.5px" }}
                    >
                        This helps us set up your account correctly.
                    </motion.p>

                    <div style={{
                        height: "1px",
                        background: "linear-gradient(90deg, transparent, rgba(255,111,174,0.4), transparent)",
                        marginBottom: "2rem"
                    }} />

                    {/* Yes / No row */}
                    <div style={{ display: "flex", gap: "1.2rem", justifyContent: "center", marginBottom: "1rem" }}>
                        <motion.button
                            className="ubian-yes"
                            whileHover={{ scale: 1.08, y: -3 }}
                            whileTap={{ scale: 0.93 }}
                            onClick={onYes}
                            style={{
                                padding: "0.85rem 2rem", borderRadius: "999px",
                                border: "1.5px solid rgba(255,111,174,0.7)",
                                background: "linear-gradient(135deg, rgba(255,111,174,0.35) 0%, rgba(255,111,174,0.15) 100%)",
                                backdropFilter: "blur(10px)", color: "#fff",
                                fontWeight: "800", fontSize: "0.95rem", cursor: "pointer",
                                letterSpacing: "1px", fontFamily: "'Courier New', monospace",
                                flex: 1, position: "relative", overflow: "hidden"
                            }}
                        >
                            ✦ Yes
                        </motion.button>

                        <motion.button
                            className="ubian-no"
                            whileHover={{ scale: 1.08, y: -3 }}
                            whileTap={{ scale: 0.93 }}
                            onClick={onNo}
                            style={{
                                padding: "0.85rem 2rem", borderRadius: "999px",
                                border: "1.5px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)",
                                color: "rgba(255,255,255,0.65)", fontWeight: "800",
                                fontSize: "0.95rem", cursor: "pointer",
                                letterSpacing: "1px", fontFamily: "'Courier New', monospace", flex: 1
                            }}
                        >
                            ✗ No
                        </motion.button>
                    </div>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase" }}>or</span>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                    </div>

                    {/* Foreigner button */}
                    <motion.button
                        className="ubian-foreigner"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => { onClose(); navigate("/bideshi"); }}
                        style={{
                            width: "100%", padding: "0.85rem 2rem", borderRadius: "999px",
                            border: "1.5px solid rgba(100,200,255,0.45)",
                            background: "linear-gradient(135deg, rgba(100,200,255,0.12) 0%, rgba(100,200,255,0.06) 100%)",
                            backdropFilter: "blur(10px)", color: "rgba(160,225,255,0.9)",
                            fontWeight: "800", fontSize: "0.9rem", cursor: "pointer",
                            letterSpacing: "1px", fontFamily: "'Courier New', monospace",
                            position: "relative", overflow: "hidden"
                        }}
                    >
                        🌍 Are you a Foreigner?
                    </motion.button>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={onClose}
                        style={{
                            color: "rgba(255,255,255,0.2)", fontSize: "0.68rem",
                            marginTop: "1.6rem", letterSpacing: "0.5px", cursor: "pointer"
                        }}
                    >
                        Press Esc or click outside to dismiss
                    </motion.p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ── Forgot Password Modal ── */
function ForgotPasswordModal({ onClose }) {
    const [resetEmail, setResetEmail] = useState("");
    const [resetStatus, setResetStatus] = useState(""); // "sent" | "error" | ""
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!resetEmail) return setResetStatus("error");
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetStatus("sent");
        } catch (err) {
            setResetStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                key="reset-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, zIndex: 20000,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}
            >
                <motion.div
                    key="reset-card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.8, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 40 }}
                    transition={{ type: "spring", damping: 18, stiffness: 260 }}
                    style={{
                        position: "relative",
                        background: "linear-gradient(135deg, rgba(20,5,20,0.97), rgba(40,10,40,0.97))",
                        border: "1.5px solid rgba(255,111,174,0.45)",
                        borderRadius: "28px",
                        padding: "2.8rem 2.2rem 2.2rem",
                        maxWidth: "390px", width: "90vw",
                        textAlign: "center",
                        boxShadow: "0 0 60px rgba(255,111,174,0.2), inset 0 0 40px rgba(255,111,174,0.04)",
                        fontFamily: "'Courier New', monospace",
                        overflow: "hidden"
                    }}
                >
                    {/* Glow orb */}
                    <div style={{
                        position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
                        width: "180px", height: "180px", borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,111,174,0.3) 0%, transparent 70%)",
                        pointerEvents: "none"
                    }} />

                    {/* Icon */}
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ fontSize: "2.2rem", marginBottom: "0.8rem" }}
                    >
                        🔑
                    </motion.div>

                    <h3 style={{
                        color: "#fff", fontSize: "1.4rem", fontWeight: "900",
                        marginBottom: "0.5rem", letterSpacing: "1px"
                    }}>
                        Reset Password
                    </h3>

                    <p style={{
                        color: "rgba(255,111,174,0.7)", fontSize: "0.8rem",
                        marginBottom: "1.8rem", letterSpacing: "0.4px", lineHeight: 1.6
                    }}>
                        Enter your email and we'll send you a reset link.
                    </p>

                    <div style={{
                        height: "1px",
                        background: "linear-gradient(90deg, transparent, rgba(255,111,174,0.35), transparent)",
                        marginBottom: "1.6rem"
                    }} />

                    <input
                        type="email"
                        placeholder="Your email address"
                        value={resetEmail}
                        onChange={(e) => { setResetEmail(e.target.value); setResetStatus(""); }}
                        style={{
                            width: "100%", padding: "0.85rem", borderRadius: "12px",
                            border: "1px solid rgba(255,111,174,0.4)",
                            background: "rgba(255,255,255,0.08)", color: "#FF6FAE",
                            outline: "none", boxSizing: "border-box", marginBottom: "1rem",
                            fontFamily: "'Courier New', monospace", fontSize: "0.9rem",
                            letterSpacing: "0.3px"
                        }}
                    />

                    <AnimatePresence>
                        {resetStatus === "sent" && (
                            <motion.p
                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ color: "#90ee90", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.6 }}
                            >
                                ✅ Reset link sent!<br />Check your inbox — if you don't see it, look in your <span style={{ color: "#f5c842", fontWeight: "800" }}>spam or junk folder</span>.
                            </motion.p>
                        )}
                        {resetStatus === "error" && (
                            <motion.p
                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ color: "#ff9999", fontSize: "0.82rem", marginBottom: "1rem" }}
                            >
                                ❌ Couldn't send reset email. Check the address.
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,111,174,0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleResetPassword}
                            disabled={loading || resetStatus === "sent"}
                            style={{
                                flex: 1, padding: "0.85rem",
                                borderRadius: "999px",
                                border: "1.5px solid rgba(255,111,174,0.7)",
                                background: "linear-gradient(135deg, rgba(255,111,174,0.35), rgba(255,111,174,0.15))",
                                color: "#fff", fontWeight: "800", fontSize: "0.9rem",
                                cursor: loading || resetStatus === "sent" ? "not-allowed" : "pointer",
                                fontFamily: "'Courier New', monospace", letterSpacing: "0.5px",
                                opacity: loading || resetStatus === "sent" ? 0.6 : 1,
                                transition: "opacity 0.2s"
                            }}
                        >
                            {loading ? "Sending..." : resetStatus === "sent" ? "Sent ✓" : "Send Link"}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            style={{
                                flex: 1, padding: "0.85rem",
                                borderRadius: "999px",
                                border: "1.5px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.6)", fontWeight: "800",
                                fontSize: "0.9rem", cursor: "pointer",
                                fontFamily: "'Courier New', monospace", letterSpacing: "0.5px"
                            }}
                        >
                            Cancel
                        </motion.button>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={onClose}
                        style={{
                            color: "rgba(255,255,255,0.2)", fontSize: "0.68rem",
                            marginTop: "1.4rem", cursor: "pointer", letterSpacing: "0.5px"
                        }}
                    >
                        Press Esc or click outside to dismiss
                    </motion.p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [petals, setPetals] = useState([]);
    const [mouse, setMouse] = useState({ x: -999, y: -999 });
    const [showRegisterPopup, setShowRegisterPopup] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const hoverSound = useRef(null);

    useEffect(() => {
        const newPetals = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            x: Math.random() * window.innerWidth,
            y: -Math.random() * window.innerHeight,
            size: Math.random() * 15 + 10,
            speed: Math.random() * 1 + 0.5,
        }));
        setPetals(newPetals);
    }, []);

    useEffect(() => {
        const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    useEffect(() => {
        const handleMove = (e) => {
            const dot = document.createElement("div");
            dot.style.position = "fixed";
            dot.style.left = e.clientX + "px";
            dot.style.top = e.clientY + "px";
            dot.style.width = "6px";
            dot.style.height = "6px";
            dot.style.borderRadius = "50%";
            dot.style.background = "#FF6FAE";
            dot.style.pointerEvents = "none";
            dot.style.boxShadow = "0 0 12px #FF6FAE, 0 0 25px #ff9ac6";
            dot.style.zIndex = 9999;
            document.body.appendChild(dot);
            setTimeout(() => dot.remove(), 500);
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    // Close modals on Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") {
                setShowRegisterPopup(false);
                setShowResetModal(false);
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;
            const docSnap = await getDoc(doc(db, "players", user.uid));

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === "banned") {
                    await auth.signOut();
                    setLoading(false);
                    setError("🚫 Your account has been banned by an operator.");
                    return;
                }
                setLoading(false);
                if (data.isAdmin === true) {
                    navigate("/admin-dashboard");
                } else {
                    navigate("/user-dashboard");
                }
            } else {
                setLoading(false);
                navigate("/user-dashboard");
            }
        } catch (err) {
            setLoading(false);
            setError(getFriendlyError(err.code));
        }
    };

    const getRepel = (px, py) => {
        const dx = px - mouse.x;
        const dy = py - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = 150;
        if (distance < radius) {
            const force = (radius - distance) / radius;
            return { x: dx * force * 0.6, y: dy * force * 0.6 };
        }
        return { x: 0, y: 0 };
    };

    return (
        <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>

            {/* Loading overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 9999,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)"
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            style={{
                                background: "rgba(255,240,245,0.1)", backdropFilter: "blur(20px)",
                                border: "1px solid rgba(255,111,174,0.4)", borderRadius: "24px",
                                padding: "2.5rem 3rem", textAlign: "center",
                                boxShadow: "0 0 60px rgba(255,111,174,0.2)"
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                style={{
                                    width: "50px", height: "50px", margin: "0 auto 1.5rem",
                                    border: "3px solid rgba(255,111,174,0.2)",
                                    borderTop: "3px solid #FF6FAE", borderRadius: "50%"
                                }}
                            />
                            <p style={{ color: "#fff", fontSize: "1rem", fontWeight: "bold", marginBottom: "0.3rem" }}>
                                Logging you in...
                            </p>
                            <p style={{ color: "#ffb6d5", fontSize: "0.85rem" }}>Wait a moment </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ubian Modal */}
            {showRegisterPopup && (
                <UbianModal
                    onClose={() => setShowRegisterPopup(false)}
                    onYes={() => { setShowRegisterPopup(false); navigate("/register"); }}
                    onNo={() => { setShowRegisterPopup(false); navigate("/non-ubian"); }}
                />
            )}

            {/* Forgot Password Modal */}
            {showResetModal && (
                <ForgotPasswordModal onClose={() => setShowResetModal(false)} />
            )}

            <video autoPlay loop muted style={{
                position: "absolute", width: "100%", height: "100%",
                objectFit: "cover", zIndex: -2, filter: "brightness(0.5)"
            }}>
                <source src="/loginbg.mp4" type="video/mp4" />
            </video>

            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: -1 }} />
            <audio ref={hoverSound} src="/sakura.mp3" preload="auto" />

            <motion.div
                whileHover={{ scale: 1.2, filter: "drop-shadow(0 0 10px #FF6FAE)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/portal")}
                style={{ position: "absolute", top: "18px", left: "18px", zIndex: 999, cursor: "pointer" }}
            >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="#FF6FAE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </motion.div>

            {/* Petals */}
            {petals.map((p) => {
                const repel = getRepel(p.x, p.y);
                return (
                    <motion.img
                        key={p.id}
                        src="/petal.png"
                        initial={{ x: p.x, y: p.y }}
                        animate={{
                            x: p.x + repel.x,
                            y: p.y + window.innerHeight + repel.y
                        }}
                        transition={{ duration: 12 / p.speed, repeat: Infinity, ease: "linear" }}
                        style={{
                            position: "absolute",
                            width: p.size,
                            opacity: 0.85,
                            pointerEvents: "none",
                            zIndex: 0
                        }}
                    />
                );
            })}

            <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                height: "100%", position: "relative", zIndex: 1
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: "rgba(255,240,245,0.12)", backdropFilter: "blur(16px)",
                        padding: "2rem 1.2rem", borderRadius: "20px", width: "100%", maxWidth: "360px",
                        border: "1px solid rgba(255,111,174,0.35)",
                        boxShadow: "0 0 30px rgba(255,182,193,0.25)"
                    }}
                >
                    <h2 style={{ color: "#fff", textAlign: "center", marginBottom: "1.5rem" }}>Login</h2>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{
                                    background: "rgba(255,100,100,0.15)", border: "1px solid rgba(255,100,100,0.4)",
                                    borderRadius: "12px", padding: "0.8rem 1rem", color: "#ff9999",
                                    marginBottom: "1rem", fontSize: "0.9rem", textAlign: "center"
                                }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit}>
                        <input
                            name="email" type="email" placeholder="Email"
                            onChange={handleChange} required
                            style={{
                                width: "100%", padding: "0.8rem", marginBottom: "1rem",
                                borderRadius: "12px", border: "1px solid rgba(255,111,174,0.4)",
                                background: "rgba(255,255,255,0.08)", color: "#FF6FAE",
                                outline: "none", boxSizing: "border-box"
                            }}
                        />

                        <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                onChange={handleChange} required
                                style={{
                                    width: "100%", padding: "0.8rem", paddingRight: "3rem",
                                    borderRadius: "12px", border: "1px solid rgba(255,111,174,0.4)",
                                    background: "rgba(255,255,255,0.08)", color: "#FF6FAE",
                                    outline: "none", boxSizing: "border-box"
                                }}
                            />
                            <div style={{
                                position: "absolute", right: "12px", top: "50%",
                                transform: "translateY(-50%)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <motion.button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    whileTap={{ scale: 0.85, rotate: 15 }}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        padding: "2px", display: "flex", alignItems: "center",
                                        justifyContent: "center", outline: "none",
                                        filter: showPassword ? "drop-shadow(0 0 6px #FF6FAE)" : "none",
                                        transition: "filter 0.25s ease"
                                    }}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <AnimatePresence mode="wait">
                                        {showPassword ? (
                                            <motion.span key="open"
                                                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                                                transition={{ duration: 0.2 }} style={{ display: "flex" }}
                                            >
                                                <EyeOpen />
                                            </motion.span>
                                        ) : (
                                            <motion.span key="closed"
                                                initial={{ opacity: 0, scale: 0.5, rotate: 20 }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                exit={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                                transition={{ duration: 0.2 }} style={{ display: "flex" }}
                                            >
                                                <EyeClosed />
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <motion.p
                            onClick={() => setShowResetModal(true)}
                            whileHover={{ scale: 1.05, textShadow: "0 0 8px #ff69b4" }}
                            style={{
                                color: "rgba(255,192,203,0.55)", fontSize: "0.76rem",
                                textAlign: "right", marginBottom: "1.4rem",
                                cursor: "pointer", userSelect: "none"
                            }}
                        >
                            Forgot password?
                        </motion.p>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,111,174,0.5)" }}
                            whileTap={{ scale: 0.95 }} type="submit"
                            style={{
                                width: "100%", padding: "0.9rem", borderRadius: "14px",
                                border: "1px solid rgba(255,111,174,0.5)",
                                background: "linear-gradient(135deg, rgba(255,111,174,0.4), rgba(255,182,193,0.2))",
                                color: "#fff", fontSize: "1rem", cursor: "pointer", backdropFilter: "blur(10px)"
                            }}
                        >
                            Login
                        </motion.button>
                    </form>

                    <motion.p
                        onClick={() => setShowRegisterPopup(true)}
                        whileHover={{ scale: 1.1, textShadow: "0 0 10px #ff69b4" }}
                        style={{ color: "#ffc0cb", textAlign: "center", marginTop: "1rem", cursor: "pointer" }}
                    >
                        No account? Register
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}

export default Login;