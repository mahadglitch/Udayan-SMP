import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const EyeOpen = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke="#FF6FAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" stroke="#FF6FAE" strokeWidth="2" fill="rgba(255,111,174,0.15)" />
    </svg>
);

const EyeClosed = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
            stroke="#FF6FAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
            stroke="#FF6FAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 1l22 22" stroke="#FF6FAE" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const getPasswordStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: "Weak", img: "/weak.png", color: "#ff4d4d" };
    if (score === 2) return { label: "Normal", img: "/normal.png", color: "#ffaa00" };
    if (score === 3) return { label: "Strong", img: "/strong.png", color: "#44cc88" };
    return { label: "Very Strong", img: "/verystrong.png", color: "#00e5ff" };
};

/* ── Welcome Announcement Modal ── */
function WelcomeModal({ onClose }) {
    return (
        <AnimatePresence>
            <motion.div
                key="welcome-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: "fixed", inset: 0, zIndex: 20000,
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}
            >
                <motion.div
                    key="welcome-card"
                    initial={{ scale: 0.7, opacity: 0, y: 60 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.7, opacity: 0, y: 60 }}
                    transition={{ type: "spring", damping: 16, stiffness: 240 }}
                    style={{
                        position: "relative",
                        background: "linear-gradient(135deg, rgba(15,5,20,0.98), rgba(35,8,35,0.98))",
                        border: "1.5px solid rgba(255,111,174,0.45)",
                        borderRadius: "28px",
                        padding: "1.8rem 2rem 1.6rem",
                        maxWidth: "380px", width: "90vw",
                        textAlign: "center",
                        boxShadow: "0 0 80px rgba(255,111,174,0.2), 0 0 160px rgba(255,111,174,0.08), inset 0 0 40px rgba(255,111,174,0.04)",
                        overflow: "hidden",
                        fontFamily: "'Courier New', monospace"
                    }}
                >
                    {/* Top glow orb */}
                    <div style={{
                        position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)",
                        width: "260px", height: "260px", borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,111,174,0.25) 0%, transparent 70%)",
                        pointerEvents: "none"
                    }} />

                    {/* Floating minecraft icon */}
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                    >
                        ⛏️
                    </motion.div>

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            display: "inline-block",
                            background: "linear-gradient(90deg, #FF6FAE, #ff9ed2, #FF6FAE)",
                            backgroundSize: "200% auto",
                            animation: "shimmer 3s linear infinite",
                            borderRadius: "50px",
                            padding: "4px 18px",
                            fontSize: "0.62rem",
                            fontWeight: "900",
                            letterSpacing: "3px",
                            color: "#fff",
                            textTransform: "uppercase",
                            marginBottom: "1.2rem",
                            boxShadow: "0 0 14px rgba(255,111,174,0.5)"
                        }}
                    >
                        ✦ Heads Up ✦
                    </motion.div>

                    <style>{`
                        @keyframes shimmer {
                            0% { background-position: -200% center; }
                            100% { background-position: 200% center; }
                        }
                    `}</style>

                    {/* Title */}
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{
                            fontSize: "1.25rem",
                            fontWeight: "900",
                            color: "#fff",
                            marginBottom: "1rem",
                            lineHeight: 1.3,
                            letterSpacing: "1px"
                        }}
                    >
                        Welcome to<br />
                        <span style={{
                            color: "#FF6FAE",
                            textShadow: "0 0 20px rgba(255,111,174,0.6)"
                        }}>
                            Udayan SMP
                        </span>
                    </motion.h2>

                    {/* Divider */}
                    <div style={{
                        height: "1px",
                        background: "linear-gradient(90deg, transparent, rgba(255,111,174,0.4), transparent)",
                        marginBottom: "1.4rem"
                    }} />

                    {/* Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        style={{
                            background: "rgba(255,111,174,0.07)",
                            border: "1px solid rgba(255,111,174,0.2)",
                            borderRadius: "16px",
                            padding: "0.9rem 1.1rem",
                            marginBottom: "1.2rem"
                        }}
                    >
                        <p style={{
                            color: "rgba(255,255,255,0.85)",
                            fontSize: "0.8rem",
                            lineHeight: 1.7,
                            margin: 0,
                            letterSpacing: "0.3px"
                        }}>
                            After you register, your Minecraft account will be{" "}
                            <span style={{ color: "#FF6FAE", fontWeight: "900" }}>
                                whitelisted on the server
                            </span>{" "}
                            within{" "}
                            <span style={{
                                color: "#f5c842",
                                fontWeight: "900",
                                textShadow: "0 0 10px rgba(245,200,66,0.5)"
                            }}>
                                24 hours ⏳
                            </span>
                            .<br /><br />
                            Sit tight — we'll get you in the server ASAP. 🗡️
                        </p>
                    </motion.div>

                    {/* OK Button */}
                    <motion.button
                        whileHover={{ scale: 1.06, boxShadow: "0 0 30px rgba(255,111,174,0.6)" }}
                        whileTap={{ scale: 0.94 }}
                        onClick={onClose}
                        style={{
                            padding: "0.75rem 3rem",
                            borderRadius: "999px",
                            border: "1.5px solid rgba(255,111,174,0.7)",
                            background: "linear-gradient(135deg, rgba(255,111,174,0.45), rgba(255,111,174,0.2))",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            fontWeight: "900",
                            fontSize: "1rem",
                            cursor: "pointer",
                            letterSpacing: "2px",
                            fontFamily: "'Courier New', monospace",
                            textTransform: "uppercase"
                        }}
                    >
                        Got it ✦
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        mcUsername: "",
        studentId: "",
        roll: "",
        section: "",
        grade: "",
        gender: ""
    });

    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [openGrade, setOpenGrade] = useState(false);
    const [openGender, setOpenGender] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [petals, setPetals] = useState([]);
    const [mouse, setMouse] = useState({ x: -999, y: -999 });
    const [loading, setLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

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
        const handleMove = (e) => {
            setMouse({ x: e.clientX, y: e.clientY });
        };
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
            dot.style.boxShadow = "0 0 10px #FF6FAE";
            dot.style.pointerEvents = "none";
            dot.style.zIndex = 9999;
            document.body.appendChild(dot);
            setTimeout(() => {
                dot.style.transition = "0.4s";
                dot.style.opacity = "0";
                dot.style.transform = "scale(2)";
                setTimeout(() => dot.remove(), 400);
            }, 10);
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    const getRepel = (px, py) => {
        const dx = px - mouse.x;
        const dy = py - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = 120;
        if (distance < radius) {
            const force = (radius - distance) / radius;
            return { x: dx * force * 0.5, y: dy * force * 0.5 };
        }
        return { x: 0, y: 0 };
    };

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === "roll" || e.target.name === "studentId") {
            value = value.replace(/\D/g, "");
        }
        if (e.target.name === "password") {
            setPasswordStrength(getPasswordStrength(value));
        }
        setForm({ ...form, [e.target.name]: value });
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const requiredFields = [
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "password", label: "Password" },
            { key: "confirmPassword", label: "Repeat Password" },
            { key: "mcUsername", label: "Minecraft Username" },
            { key: "studentId", label: "Student ID" },
            { key: "roll", label: "Roll Number" },
            { key: "section", label: "Section" },
            { key: "grade", label: "Grade" },
            { key: "gender", label: "Gender" },
        ];

        const missingField = requiredFields.find(field => !form[field.key]?.trim());

        if (missingField) {
            return setError(` Please fill in ${missingField.label}.`);
        }

        if (!isValidEmail(form.email)) {
            return setError(" Please enter a valid email address.");
        }
        if (form.password.length < 4) {
            return setError(" Password must be at least 4 characters.");
        }
        if (form.password !== form.confirmPassword) {
            return setError(" Passwords do not match.");
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;

            await setDoc(doc(db, "players", user.uid), {
                name: form.name,
                email: form.email,
                mcUsername: form.mcUsername,
                studentId: form.studentId,
                roll: form.roll,
                section: form.section,
                grade: form.grade,
                gender: form.gender,
                role: "user",
                isAdmin: false,
                status: "active",
                registeredAt: new Date().toISOString(),
                createdAt: new Date(),
            });

            setLoading(false);
            navigate("/user-dashboard");
        } catch (err) {
            setLoading(false);
            setError(err.message);
        }
    };

    return (
        <div style={{ minHeight: "100vh", position: "relative", overflowY: "auto" }}>

            {/* Welcome Announcement Modal */}
            {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

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
                                Summoning your account...
                            </p>
                            <p style={{ color: "#ffb6d5", fontSize: "0.85rem" }}>Wait a moment</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                onClick={() => navigate("/portal")}
                whileHover={{ scale: 1.2 }}
                style={{ position: "fixed", top: 20, left: 20, cursor: "pointer", zIndex: 999 }}
            >
                <svg width="34" height="34" viewBox="0 0 24 24">
                    <path d="M15 18L9 12L15 6" stroke="#FF6FAE" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </motion.div>

            <video autoPlay loop muted style={{
                position: "fixed", width: "100%", height: "100%",
                objectFit: "cover", zIndex: -2, filter: "brightness(0.5)"
            }}>
                <source src="/loginbg.mp4" />
            </video>

            <div style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.4)",
                zIndex: -1
            }} />

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
                            position: "fixed",
                            width: p.size,
                            opacity: 0.85,
                            pointerEvents: "none",
                            zIndex: 0
                        }}
                    />
                );
            })}

            <div style={{ display: "flex", justifyContent: "center", padding: "60px 20px", position: "relative", zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        width: "100%",
                        maxWidth: 400,
                        padding: "2rem",
                        borderRadius: 20,
                        backdropFilter: "blur(16px)",
                        background: "rgba(255,240,245,0.12)",
                        border: "1px solid rgba(255,111,174,0.35)",
                        boxShadow: "0 0 30px rgba(255,182,193,0.25)"
                    }}
                >
                    <h2 style={{ color: "#fff", textAlign: "center", marginBottom: "1.5rem" }}>Register</h2>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    background: "rgba(255,80,80,0.15)",
                                    border: "1px solid rgba(255,80,80,0.4)",
                                    borderRadius: 12, padding: "0.75rem 1rem",
                                    color: "#ff9999", marginBottom: "1rem",
                                    fontSize: "0.88rem", textAlign: "center"
                                }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit}>
                        <input name="name" placeholder="Name" onChange={handleChange} required style={input} />
                        <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={input} />

                        <div style={{ position: "relative", marginBottom: 6 }}>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                onChange={handleChange}
                                required
                                style={{ ...input, marginBottom: 0, paddingRight: "3rem" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                style={{
                                    position: "absolute", right: 12, top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none", border: "none",
                                    cursor: "pointer", display: "flex",
                                    alignItems: "center", padding: 2,
                                    outline: "none"
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {showPassword ? (
                                        <motion.span key="open"
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: "flex" }}
                                        >
                                            <EyeOpen />
                                        </motion.span>
                                    ) : (
                                        <motion.span key="closed"
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: "flex" }}
                                        >
                                            <EyeClosed />
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>

                        <AnimatePresence>
                            {passwordStrength && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        display: "flex", alignItems: "center",
                                        gap: "8px", marginBottom: 10, marginTop: 6,
                                        padding: "6px 10px",
                                        borderRadius: 10,
                                        background: "rgba(255,255,255,0.05)",
                                        border: `1px solid ${passwordStrength.color}44`
                                    }}
                                >
                                    <img
                                        src={passwordStrength.img}
                                        alt={passwordStrength.label}
                                        style={{ width: 22, height: 22, objectFit: "contain" }}
                                    />
                                    <span style={{
                                        color: passwordStrength.color,
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        letterSpacing: "0.5px"
                                    }}>
                                        {passwordStrength.label}
                                    </span>
                                    <div style={{
                                        flex: 1, height: 4, borderRadius: 4,
                                        background: "rgba(255,255,255,0.1)", overflow: "hidden"
                                    }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: passwordStrength.label === "Weak" ? "25%" :
                                                    passwordStrength.label === "Normal" ? "50%" :
                                                        passwordStrength.label === "Strong" ? "75%" : "100%"
                                            }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            style={{
                                                height: "100%", borderRadius: 4,
                                                background: passwordStrength.color
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ position: "relative", marginBottom: 10 }}>
                            <input
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                placeholder="Repeat Password"
                                onChange={handleChange}
                                required
                                style={{ ...input, marginBottom: 0, paddingRight: "3rem" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(p => !p)}
                                style={{
                                    position: "absolute", right: 12, top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none", border: "none",
                                    cursor: "pointer", display: "flex",
                                    alignItems: "center", padding: 2,
                                    outline: "none"
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {showConfirm ? (
                                        <motion.span key="open"
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: "flex" }}
                                        ><EyeOpen /></motion.span>
                                    ) : (
                                        <motion.span key="closed"
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: "flex" }}
                                        ><EyeClosed /></motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>

                        <AnimatePresence>
                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        color: "#ff6b6b", fontSize: "0.8rem",
                                        marginBottom: 10, marginTop: -4,
                                        paddingLeft: 4
                                    }}
                                >
                                    ❌ Passwords do not match
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <input name="mcUsername" placeholder="Minecraft Username" onChange={handleChange} style={input} />

                        <input
                            name="studentId"
                            placeholder="Student ID"
                            onChange={handleChange}
                            value={form.studentId}
                            inputMode="numeric"
                            style={input}
                        />
                        <input
                            name="roll"
                            placeholder="Roll Number"
                            onChange={handleChange}
                            value={form.roll}
                            inputMode="numeric"
                            style={input}
                        />

                        <input name="section" placeholder="Section" onChange={handleChange} style={input} />

                        <div onClick={() => { setOpenGender(!openGender); setOpenGrade(false); }} style={dropdownBox}>
                            {form.gender || "Select Gender"}
                        </div>
                        {openGender && (
                            <div style={dropdownMenu}>
                                {["Male", "Female", "Other"].map((g) => (
                                    <div key={g}
                                        onClick={() => { setForm({ ...form, gender: g }); setOpenGender(false); }}
                                        style={dropdownItem}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,111,174,0.2)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >{g}</div>
                                ))}
                            </div>
                        )}

                        <div onClick={() => { setOpenGrade(!openGrade); setOpenGender(false); }} style={dropdownBox}>
                            {form.grade || "Select Grade"}
                        </div>
                        {openGrade && (
                            <div style={dropdownMenu}>
                                {[...Array(12)].map((_, i) => (
                                    <div key={i}
                                        onClick={() => { setForm({ ...form, grade: `Grade ${i + 1}` }); setOpenGrade(false); }}
                                        style={dropdownItem}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,111,174,0.2)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >Grade {i + 1}</div>
                                ))}
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,111,174,0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={loading}
                            style={{
                                ...btn,
                                opacity: loading ? 0.65 : 1,
                                cursor: loading ? "not-allowed" : "pointer"
                            }}
                        >
                            {loading ? "Registering..." : "Register"}
                        </motion.button>

                        <motion.p
                            onClick={() => navigate("/login")}
                            whileHover={{ scale: 1.1, textShadow: "0 0 10px #ff69b4" }}
                            style={{ color: "#ffc0cb", textAlign: "center", marginTop: "1rem", cursor: "pointer" }}
                        >
                            Already have an account? Login
                        </motion.p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

const input = {
    width: "100%",
    padding: "0.8rem",
    marginBottom: "1rem",
    borderRadius: 12,
    border: "1px solid rgba(255,111,174,0.4)",
    background: "rgba(255,255,255,0.08)",
    color: "#FF6FAE",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit"
};

const btn = {
    width: "100%",
    padding: "0.9rem",
    borderRadius: 14,
    border: "1px solid rgba(255,111,174,0.5)",
    background: "linear-gradient(135deg, rgba(255,111,174,0.4), rgba(255,182,193,0.2))",
    color: "#fff",
    cursor: "pointer",
    marginTop: 10,
    fontSize: "1rem",
    fontWeight: "600",
    backdropFilter: "blur(10px)"
};

const dropdownBox = {
    width: "100%",
    padding: "0.8rem",
    borderRadius: 12,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,111,174,0.4)",
    color: "#FF6FAE",
    cursor: "pointer",
    marginBottom: 10,
    boxSizing: "border-box"
};

const dropdownMenu = {
    background: "rgba(10,5,20,0.9)",
    backdropFilter: "blur(18px)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    border: "1px solid rgba(255,111,174,0.2)"
};

const dropdownItem = {
    padding: 10,
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.2s"
};

export default Register;