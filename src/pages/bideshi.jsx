import { useState, useEffect } from "react";
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

const ALL_COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
    "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
    "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
    "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
    "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
    "Czechia (Czech Republic)", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
    "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
    "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
    "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran",
    "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
    "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
    "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
    "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
    "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
    "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands",
    "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
    "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea",
    "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
    "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
    "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
    "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
    "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
    "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand",
    "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
    "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
    "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam",
    "Yemen", "Zambia", "Zimbabwe"
];

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
                    <div style={{
                        position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)",
                        width: "260px", height: "260px", borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,111,174,0.25) 0%, transparent 70%)",
                        pointerEvents: "none"
                    }} />

                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                    >
                        🌍
                    </motion.div>

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
                        ✦ International ✦
                    </motion.div>

                    <style>{`
                        @keyframes shimmer {
                            0% { background-position: -200% center; }
                            100% { background-position: 200% center; }
                        }
                    `}</style>

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
                            Udayan SMP!
                        </span>
                    </motion.h2>

                    <div style={{
                        height: "1px",
                        background: "linear-gradient(90deg, transparent, rgba(255,111,174,0.4), transparent)",
                        marginBottom: "1.4rem"
                    }} />

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
                            Discord & Instagram are optional — but help us find you! 🗡️
                        </p>
                    </motion.div>

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

/* ── Country Dropdown with search ── */
function CountryDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = ALL_COUNTRIES.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ position: "relative", marginBottom: 10 }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={dropdownBox}
            >
                {value || "Select Country"}
                <span style={{ float: "right", opacity: 0.6, fontSize: "0.8rem" }}>
                    {open ? "▲" : "▼"}
                </span>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                        transition={{ duration: 0.18 }}
                        style={{
                            ...dropdownMenu,
                            position: "absolute",
                            top: "100%",
                            left: 0, right: 0,
                            zIndex: 5000,
                            maxHeight: "220px",
                            overflowY: "auto",
                            transformOrigin: "top"
                        }}
                    >
                        {/* Search inside dropdown */}
                        <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,111,174,0.15)" }}>
                            <input
                                autoFocus
                                placeholder="Search country..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    width: "100%",
                                    background: "rgba(255,255,255,0.07)",
                                    border: "1px solid rgba(255,111,174,0.3)",
                                    borderRadius: 8,
                                    padding: "6px 10px",
                                    color: "#FF6FAE",
                                    outline: "none",
                                    fontSize: "0.82rem",
                                    boxSizing: "border-box",
                                    fontFamily: "inherit"
                                }}
                            />
                        </div>

                        {filtered.length === 0 ? (
                            <div style={{ ...dropdownItem, color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                                No country found
                            </div>
                        ) : filtered.map((country) => (
                            <div
                                key={country}
                                onClick={() => { onChange(country); setOpen(false); setSearch(""); }}
                                style={dropdownItem}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,111,174,0.2)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                {country}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
function GenderSelector({ value, onChange }) {
    const genders = ["Male", "Female", "Other"];
    return (
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
            {genders.map(g => (
                <motion.button
                    key={g}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChange(g)}
                    style={{
                        flex: 1,
                        padding: "0.7rem 0",
                        borderRadius: "12px",
                        border: value === g
                            ? "1.5px solid rgba(255,111,174,0.8)"
                            : "1px solid rgba(255,111,174,0.25)",
                        background: value === g
                            ? "linear-gradient(135deg, rgba(255,111,174,0.35), rgba(255,111,174,0.15))"
                            : "rgba(255,255,255,0.05)",
                        color: value === g ? "#fff" : "rgba(255,255,255,0.4)",
                        fontWeight: value === g ? "800" : "500",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        letterSpacing: "0.5px",
                        transition: "all 0.2s",
                        boxShadow: value === g ? "0 0 12px rgba(255,111,174,0.3)" : "none"
                    }}
                >
                    {g === "Male" ? "♂ Male" : g === "Female" ? "♀ Female" : "⚧ Other"}
                </motion.button>
            ))}
        </div>
    );
}
function Bideshi() {
    const navigate = useNavigate();

const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mcUsername: "",
    country: "",
    gender: "",        
    discordId: "",
    instagramId: ""
});

    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
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
        const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    useEffect(() => {
        const handleMove = (e) => {
            const dot = document.createElement("div");
            dot.style.cssText = `
                position:fixed; left:${e.clientX}px; top:${e.clientY}px;
                width:6px; height:6px; border-radius:50%;
                background:#FF6FAE; box-shadow:0 0 10px #FF6FAE;
                pointer-events:none; z-index:9999;
            `;
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
        const { name, value } = e.target;
        if (name === "password") setPasswordStrength(getPasswordStrength(value));
        setForm(prev => ({ ...prev, [name]: value }));
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
    { key: "country", label: "Country" },
    { key: "gender", label: "Gender" },    
];

        const missingField = requiredFields.find(f => !form[f.key]?.trim());
        if (missingField) return setError(` Please fill in ${missingField.label}.`);
        if (!isValidEmail(form.email)) return setError(" Please enter a valid email address.");
        if (form.password.length < 4) return setError(" Password must be at least 4 characters.");
        if (form.password !== form.confirmPassword) return setError(" Passwords do not match.");

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;

 await setDoc(doc(db, "players", user.uid), {
    name: form.name,
    email: form.email,
    mcUsername: form.mcUsername,
    country: form.country,
    gender: form.gender,           
    discordId: form.discordId || null,
    instagramId: form.instagramId || null,
    role: "user",
    isAdmin: false,
    playerType: "foreigner",
    isForeigner: true,
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

            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: -1 }} />

            {petals.map((p) => {
                const repel = getRepel(p.x, p.y);
                return (
                    <motion.img
                        key={p.id}
                        src="/petal.png"
                        initial={{ x: p.x, y: p.y }}
                        animate={{ x: p.x + repel.x, y: p.y + window.innerHeight + repel.y }}
                        transition={{ duration: 12 / p.speed, repeat: Infinity, ease: "linear" }}
                        style={{ position: "fixed", width: p.size, opacity: 0.85, pointerEvents: "none", zIndex: 0 }}
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
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>🌍</div>
                        <h2 style={{ color: "#fff", margin: 0, marginBottom: "0.3rem" }}>Foreigner Register</h2>
                        <p style={{ color: "rgba(255,182,193,0.7)", fontSize: "0.78rem", margin: 0 }}>
                            International Player Registration
                        </p>
                    </div>

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

                        {/* Name */}
                        <input name="name" placeholder="Full Name" onChange={handleChange} required style={inputStyle} />

                        {/* Email */}
                        <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={inputStyle} />

                        {/* Password */}
                        <div style={{ position: "relative", marginBottom: 6 }}>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                onChange={handleChange}
                                required
                                style={{ ...inputStyle, marginBottom: 0, paddingRight: "3rem" }}
                            />
                            <button type="button" onClick={() => setShowPassword(p => !p)} style={eyeBtn}>
                                <AnimatePresence mode="wait">
                                    {showPassword ? (
                                        <motion.span key="open"
                                            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}
                                            style={{ display: "flex" }}
                                        ><EyeOpen /></motion.span>
                                    ) : (
                                        <motion.span key="closed"
                                            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}
                                            style={{ display: "flex" }}
                                        ><EyeClosed /></motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>

                        {/* Password Strength */}
                        <AnimatePresence>
                            {passwordStrength && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "8px",
                                        marginBottom: 10, marginTop: 6, padding: "6px 10px",
                                        borderRadius: 10, background: "rgba(255,255,255,0.05)",
                                        border: `1px solid ${passwordStrength.color}44`
                                    }}
                                >
                                    <img src={passwordStrength.img} alt={passwordStrength.label}
                                        style={{ width: 22, height: 22, objectFit: "contain" }} />
                                    <span style={{ color: passwordStrength.color, fontSize: "0.8rem", fontWeight: "700", letterSpacing: "0.5px" }}>
                                        {passwordStrength.label}
                                    </span>
                                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: passwordStrength.label === "Weak" ? "25%" :
                                                    passwordStrength.label === "Normal" ? "50%" :
                                                        passwordStrength.label === "Strong" ? "75%" : "100%"
                                            }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            style={{ height: "100%", borderRadius: 4, background: passwordStrength.color }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Confirm Password */}
                        <div style={{ position: "relative", marginBottom: 10 }}>
                            <input
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                placeholder="Repeat Password"
                                onChange={handleChange}
                                required
                                style={{ ...inputStyle, marginBottom: 0, paddingRight: "3rem" }}
                            />
                            <button type="button" onClick={() => setShowConfirm(p => !p)} style={eyeBtn}>
                                <AnimatePresence mode="wait">
                                    {showConfirm ? (
                                        <motion.span key="open"
                                            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}
                                            style={{ display: "flex" }}
                                        ><EyeOpen /></motion.span>
                                    ) : (
                                        <motion.span key="closed"
                                            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}
                                            style={{ display: "flex" }}
                                        ><EyeClosed /></motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>

                        <AnimatePresence>
                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    style={{ color: "#ff6b6b", fontSize: "0.8rem", marginBottom: 10, marginTop: -4, paddingLeft: 4 }}
                                >
                                    ❌ Passwords do not match
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Minecraft Username */}
                        <input name="mcUsername" placeholder="Minecraft Username" onChange={handleChange} required style={inputStyle} />

                        {/* Country Dropdown */}
                        <CountryDropdown
                            value={form.country}
                            onChange={(val) => setForm(prev => ({ ...prev, country: val }))}
                        />
{/* Gender Selector */}
<GenderSelector
    value={form.gender}
    onChange={(val) => setForm(prev => ({ ...prev, gender: val }))}
/>
                        {/* Divider for optional fields */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            marginBottom: "12px", marginTop: "4px"
                        }}>
                            <div style={{ flex: 1, height: "1px", background: "rgba(255,111,174,0.2)" }} />
                            <span style={{ color: "rgba(255,182,193,0.55)", fontSize: "0.72rem", letterSpacing: "1.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                                Optional
                            </span>
                            <div style={{ flex: 1, height: "1px", background: "rgba(255,111,174,0.2)" }} />
                        </div>

                        {/* Discord ID */}
                        <div style={{ position: "relative", marginBottom: "1rem" }}>
                            <span style={{
                                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                                color: "rgba(255,111,174,0.6)", fontSize: "0.9rem", pointerEvents: "none"
                            }}>
                                {/* Discord icon */}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
                                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" fill="#FF6FAE" opacity="0.8" />
                                </svg>
                            </span>
                            <input
                                name="discordId"
                                placeholder="Discord ID (e.g. username#1234)"
                                onChange={handleChange}
                                value={form.discordId}
                                style={{ ...inputStyle, marginBottom: 0, paddingLeft: "2.2rem" }}
                            />
                        </div>

                        {/* Instagram ID */}
                        <div style={{ position: "relative", marginBottom: "1rem" }}>
                            <span style={{
                                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                                color: "rgba(255,111,174,0.6)", fontSize: "0.9rem", pointerEvents: "none"
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#FF6FAE" strokeWidth="2" opacity="0.8" />
                                    <circle cx="12" cy="12" r="4" stroke="#FF6FAE" strokeWidth="2" opacity="0.8" />
                                    <circle cx="17.5" cy="6.5" r="1" fill="#FF6FAE" opacity="0.8" />
                                </svg>
                            </span>
                            <input
                                name="instagramId"
                                placeholder="Instagram ID (e.g. @username)"
                                onChange={handleChange}
                                value={form.instagramId}
                                style={{ ...inputStyle, marginBottom: 0, paddingLeft: "2.2rem" }}
                            />
                        </div>

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

const inputStyle = {
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

const eyeBtn = {
    position: "absolute", right: 12, top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none",
    cursor: "pointer", display: "flex",
    alignItems: "center", padding: 2,
    outline: "none"
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
    background: "rgba(10,5,20,0.95)",
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
    transition: "background 0.2s",
    fontSize: "0.88rem"
};

export default Bideshi;