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

const BANGLADESH_SCHOOLS = [
    "Adamjee Cantonment Public School, Dhaka",
    "Agrani School and College, Dhaka",
    "Azimpur Government Girls' School and College, Dhaka",
    "BAF Shaheen College Dhaka",
    "BAF Shaheen College Chittagong",
    "BAF Shaheen College Jessore",
    "BARD Laboratory School, Comilla",
    "BN School and College, Dhaka",
    "Birshreshtha Noor Mohammad Public College, Dhaka",
    "Blue Bird School and College, Sylhet",
    "Bogura Zilla School, Bogura",
    "Cantonment Board High School, Dhaka",
    "Cantonment Board High School, Rangpur",
    "Chattogram Collegiate School, Chattogram",
    "Chattogram Government High School, Chattogram",
    "Chattogram Government Model High School, Chattogram",
    "Comilla Zilla School, Comilla",
    "Comilla Cadet College, Comilla",
    "Dhanmondi Government Boys' High School, Dhaka",
    "Dhaka College, Dhaka",
    "Dhaka City College, Dhaka",
    "Dhaka Commerce College, Dhaka",
    "Dhaka Collegiate School, Dhaka",
    "Dhaka Government Muslim High School, Dhaka",
    "Dhaka Imperial College, Dhaka",
    "Dhaka Residential Model College, Dhaka",
    "Dr. Khastagir Government Girls' High School, Chattogram",
    "Faujdarhat Cadet College, Chattogram",
    "Gazipur Cantonment High School, Gazipur",
    "Government Laboratory High School, Dhaka",
    "Government Muslim High School, Sylhet",
    "Government Pilot High School, Khulna",
    "Government Science College, Dhaka",
    "Government Science High School, Dhaka",
    "Holy Cross Girls' High School, Dhaka",
    "Ideal School and College, Dhaka",
    "Ispahani Public School and College, Chattogram",
    "Jhenaidah Cadet College, Jhenaidah",
    "Jessore Zilla School, Jessore",
    "Khulna Zilla School, Khulna",
    "Little Jewels Nursery Infant And Junior School",
    "Manikganj Government High School, Manikganj",
    "Maple Leaf International School, Dhaka",
    "Master da Surya Sen School and College, Chattogram",
    "Milestone College, Dhaka",
    "Mirpur Bangla School and College, Dhaka",
    "Mirpur Cantonment English School and College, Dhaka",
    "Mohammad Ali High School, Bogura",
    "Motijheel Government Boys' High School, Dhaka",
    "Motijheel Model High School and College, Dhaka",
    "Munshiganj High School, Munshiganj",
    "Mymensingh Zilla School, Mymensingh",
    "Narayanganj High School, Narayanganj",
    "Narayanganj Government Girls' High School, Narayanganj",
    "Narsingdi Government High School, Narsingdi",
    "National Ideal School, Dhaka",
    "Natore Government High School, Natore",
    "Noakhali Zilla School, Noakhali",
    "Notre Dame College, Dhaka",
    "Pabna Zilla School, Pabna",
    "Poura Collegiate Girls' High School, Rajshahi",
    "Priyobhashini Girls' High School, Narayanganj",
    "Rajshahi Collegiate School, Rajshahi",
    "Rajshahi Government High School, Rajshahi",
    "Rajuk Uttara Model College, Dhaka",
    "Rangpur Cadet College, Rangpur",
    "Rangpur Zilla School, Rangpur",
    "Rayer Bazar High School, Dhaka",
    "Saint Francis Xavier's Green Herald International School, Dhaka",
    "Saint Gregory High School and College, Dhaka",
    "Saint Joseph Higher Secondary School, Dhaka",
    "Saint Placid's High School, Chattogram",
    "Scholastica School, Dhaka",
    "Shaheed Bir Uttam Lt. Anwar Girls' College, Dhaka",
    "Shaheed Police Smrity School and College, Dhaka",
    "Sher-e-Bangla Nagar Government Boys' High School, Dhaka",
    "Sirajganj Government High School, Sirajganj",
    "Sultan Mohammad High School, Sylhet",
    "Sunnydale School, Dhaka",
    "Sunflower School and College, Dhaka",
    "Sylhet Cadet College, Sylhet",
    "Sylhet Government Pilot High School, Sylhet",
    "Tangail Government High School, Tangail",
    "Tejgaon High School, Dhaka", "The Aga Khan School, Dhaka",
    "Udayan Higher Secondary School, Dhaka",
    "Uttara Academy, Dhaka",
    "University Laboratory School and College, Dhaka",
    "University of Dhaka School and College, Dhaka",
    "Viqarunnisa Noon School and College, Dhaka",
    "Willes Little Flower School and College, Dhaka",
    "Zainul Abedin School and College, Dhaka",
    "Academia School", "American International School Dhaka",
    "Anandamoyee Girls' High School", "Armanitola Government High School",
    "Averroes International School", "Bangabandhu Government Secondary School",
    "Bangladesh Bank Adarsha High School", "Bangladesh International Tutorial",
    "Banasree Ideal School and College", "Baridhara Scholars International School and College",
    "Basabo Government Boys High School", "Basabo Government Girls High School",
    "Begum Badrunnessa Government Girls' College", "BEPZA Public School and College",
    "Bir Uttam Shaheed Mahbub School and College", "Cambrian School and College",
    "Canadian International School Bangladesh", "Cantonment English School and College",
    "Cherry Blossoms International School and College", "Civil Aviation School and College",
    "Crescent School and College", "Daffodil International School",
    "Dhanmondi Government Girls' High School", "Dhanmondi Tutorial",
    "Dhaka International School", "Dhaka Public School and College",
    "Dhaka Shikkha Niketan", "Don Bosco School and College",
    "East West International School and College", "Engineering University School and College",
    "European Standard School", "Gandaria High School",
    "Genius Laboratory School and College", "Global International School Dhaka",
    "Golden Deer Junior School", "Green Gems International School",
    "Greenfield International School", "Gulshan Model High School and College",
    "Haque International School", "Heed International School",
    "Imperial International School", "International Hope School Bangladesh",
    "International School Dhaka", "Islami Adarsha High School",
    "Jatrabari Ideal School and College", "Jhigatola Government High School",
    "Kallyanpur Girls School and College", "Khilgaon Government High School",
    "Kings College Dhaka", "Kurmitola High School and College",
    "Lalmatia Government Girls High School", "Manarat Dhaka International School",
    "Marie Curie School", "Mastermind School", "Mirpur Government High School",
    "Model Academy", "Monipur Girls' High School", "Monipur High School and College",
    "Motijheel Government Girls' High School", "Motijheel Ideal School and College",
    "Muslim Modern Academy", "Nawab Habibullah Model School and College",
    "Nawabpur Government High School", "Northern International School",
    "Oxford International School", "Pallabi Model High School",
    "Park International School", "Playpen School", "Premier School Dhaka",
    "Progressive Model School", "Queen's School and College",
    "Rajarbag Police Lines School and College", "Residential Model School",
    "Rupnagar Model School", "Scholars School and College",
    "Sher-E-Bangla School and College", "Shere Bangla Nagar Government Girls' High School",
    "Sir John Wilson School", "SOS Hermann Gmeiner College", "South Breeze School",
    "South Point School", "Springdale International School", "Standard International School",
    "St. Joseph Higher Secondary School", "Sunny Hill International School",
    "Sunbeams School", "Sunrise School and College", "Tejgaon Government High School",
    "The Capital School Dhaka", "The City School Bangladesh", "The Millennium Stars School",
    "The New School Dhaka", "The Scholars School", "Trust School and College",
    "Udayan Uchcha Madhyamik Bidyalaya", "Universal Tutorial", "Uttara Crescent School",
    "Uttara High School and College", "Uttara Model School", "Vision International School",
    "Wari High School", "West End High School", "Women's Federation High School",
    "Yale International School", "YWCA Higher Secondary Girls School",
    "Zigatola Government High School", "Zenith School and College",
    "Mohammadpur Government High School", "Scholastica", "Sunnydale", "BCIC College",
    "Mirpur Shaheen School", "BAF Shaheen English Medium College",
    "Kamrunnessa Government Girls' High School",
    "Birsreshtha Munshi Abdur Rouf Public College",
    "Shaheed Ramiz Uddin Cantonment School and College",
    "Bangladesh Navy College", "Nirjhor Cantonment Public School and College",
    "Mohammadpur Preparatory School and College", "Ideal Government Primary School",
    "DPS STS School Dhaka", "Canadian Trillinium School",
    "Singapore International School Dhaka", "South Point Education Society School",
    "Imperial College School Section", "Maple Bear Canadian School",
    "Euro International School", "Orient International School",
    "Little Flower International School", "Morning Glory School",
    "Brilliant Grammar School", "Oxford Elite School", "Scholars Tutorial School",
    "Pledge Harbor International School", "Future Generation School",
    "Gateway International School", "Happy Days School",
    "Ideal Preparatory and High School", "Insight School and College",
    "Intellect School and College", "Knowledge Valley School",
    "Leaders School and College", "Light House School",
    "Meridian International School", "Metropolitan School and College",
    "Modern Child School", "Modern Preparatory School", "Moonlight School",
    "Nightingale School", "North South Laboratory School",
    "Notre Dame Preparatory School", "Pacific School and College",
    "Pathfinder School", "Pearl School and College", "Presidency School",
    "Prime Scholars School", "Progressive International School",
    "Royal Academy School", "Scholars Home School", "Sea Breeze International School",
    "Skyline School and College", "Smart Education School",
    "South East School and College", "Star Kids School",
    "Step Ahead International School", "Sunflower School",
    "The Aga Khan Academy Dhaka", "The Earth School", "The Educators Dhaka",
    "The Excellence School", "The Future School Dhaka", "The Green School",
    "The Oxford School", "Tiny Tots School", "Unique High School",
    "Unity International School", "Urban School Dhaka", "Valley View School",
    "Victory School and College", "Wisdom Tree School", "Young Minds School",
    "Others"
].sort((a, b) => a.localeCompare(b));

/* ── Gender Selector ── */
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

/* ── Welcome Modal ── */
function WelcomeModal({ onClose }) {
    return (
        <AnimatePresence>
            <motion.div
                key="welcome-backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                    position: "fixed", inset: 0, zIndex: 20000,
                    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
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
                        border: "1.5px solid rgba(255,111,174,0.45)", borderRadius: "28px",
                        padding: "1.8rem 2rem 1.6rem", maxWidth: "380px", width: "90vw",
                        textAlign: "center",
                        boxShadow: "0 0 80px rgba(255,111,174,0.2), 0 0 160px rgba(255,111,174,0.08), inset 0 0 40px rgba(255,111,174,0.04)",
                        overflow: "hidden", fontFamily: "'Courier New', monospace"
                    }}
                >
                    <div style={{
                        position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)",
                        width: "260px", height: "260px", borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,111,174,0.25) 0%, transparent 70%)",
                        pointerEvents: "none"
                    }} />
                    <style>{`@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }`}</style>
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                    >⛏️</motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={{
                            display: "inline-block",
                            background: "linear-gradient(90deg, #FF6FAE, #ff9ed2, #FF6FAE)",
                            backgroundSize: "200% auto", animation: "shimmer 3s linear infinite",
                            borderRadius: "50px", padding: "4px 18px", fontSize: "0.62rem",
                            fontWeight: "900", letterSpacing: "3px", color: "#fff",
                            textTransform: "uppercase", marginBottom: "1rem",
                            boxShadow: "0 0 14px rgba(255,111,174,0.5)"
                        }}
                    >✦ Heads Up ✦</motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        style={{ fontSize: "1.25rem", fontWeight: "900", color: "#fff", marginBottom: "0.8rem", lineHeight: 1.3, letterSpacing: "1px" }}
                    >
                        Welcome to{" "}
                        <span style={{ color: "#FF6FAE", textShadow: "0 0 20px rgba(255,111,174,0.6)" }}>Udayan SMP</span>
                    </motion.h2>
                    <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,111,174,0.4), transparent)", marginBottom: "1rem" }} />
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                        style={{ background: "rgba(255,111,174,0.07)", border: "1px solid rgba(255,111,174,0.2)", borderRadius: "16px", padding: "0.9rem 1.1rem", marginBottom: "1.2rem" }}
                    >
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", lineHeight: 1.7, margin: 0, letterSpacing: "0.3px" }}>
                            After you register, your Minecraft account will be{" "}
                            <span style={{ color: "#FF6FAE", fontWeight: "900" }}>whitelisted on the server</span>{" "}
                            within{" "}
                            <span style={{ color: "#f5c842", fontWeight: "900", textShadow: "0 0 10px rgba(245,200,66,0.5)" }}>24 hours ⏳</span>
                            .<br /><br />
                            Sit tight — we'll get you in the server ASAP. 🗡️
                        </p>
                    </motion.div>
                    <motion.button
                        whileHover={{ scale: 1.06, boxShadow: "0 0 30px rgba(255,111,174,0.6)" }}
                        whileTap={{ scale: 0.94 }}
                        onClick={onClose}
                        style={{
                            padding: "0.75rem 3rem", borderRadius: "999px",
                            border: "1.5px solid rgba(255,111,174,0.7)",
                            background: "linear-gradient(135deg, rgba(255,111,174,0.45), rgba(255,111,174,0.2))",
                            backdropFilter: "blur(10px)", color: "#fff", fontWeight: "900",
                            fontSize: "1rem", cursor: "pointer", letterSpacing: "2px",
                            fontFamily: "'Courier New', monospace", textTransform: "uppercase"
                        }}
                    >Got it ✦</motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function NonUbian() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "", email: "", password: "", confirmPassword: "",
        mcUsername: "", school: "", grade: "", gender: ""
    });

    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [openGrade, setOpenGrade] = useState(false);
    const [openSchool, setOpenSchool] = useState(false);
    const [schoolSearch, setSchoolSearch] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [petals, setPetals] = useState([]);
    const [mouse, setMouse] = useState({ x: -999, y: -999 });
    const [loading, setLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

    const filteredSchools = BANGLADESH_SCHOOLS.filter(s =>
        s.toLowerCase().includes(schoolSearch.toLowerCase())
    );

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
        if (e.target.name === "password") setPasswordStrength(getPasswordStrength(value));
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
            { key: "school", label: "School" },
            { key: "grade", label: "Grade" },
            { key: "gender", label: "Gender" },
        ];

        const missingField = requiredFields.find(f => !form[f.key]?.trim());
        if (missingField) return setError(`⚠️ Please fill in ${missingField.label}.`);
        if (!isValidEmail(form.email)) return setError("⚠️ Please enter a valid email address.");
        if (form.password.length < 4) return setError("⚠️ Password must be at least 4 characters.");
        if (form.password !== form.confirmPassword) return setError("❌ Passwords do not match.");

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;
            await setDoc(doc(db, "players", user.uid), {
                name: form.name,
                email: form.email,
                mcUsername: form.mcUsername,
                school: form.school,
                grade: form.grade,
                gender: form.gender,
                role: "user",
                isAdmin: false,
                status: "active",
                registeredAt: new Date().toISOString(),
                createdAt: new Date(),
            });
            setLoading(false);
            navigate("/login");
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
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        width: "100%", maxWidth: 400, padding: "2rem", borderRadius: 20,
                        backdropFilter: "blur(16px)", background: "rgba(255,240,245,0.12)",
                        border: "1px solid rgba(255,111,174,0.35)",
                        boxShadow: "0 0 30px rgba(255,182,193,0.25)"
                    }}
                >
                    <h2 style={{ color: "#fff", textAlign: "center", marginBottom: "1.5rem" }}>Register</h2>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{
                                    background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.4)",
                                    borderRadius: 12, padding: "0.75rem 1rem", color: "#ff9999",
                                    marginBottom: "1rem", fontSize: "0.88rem", textAlign: "center"
                                }}
                            >{error}</motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit}>
                        <input name="name" placeholder="Name" onChange={handleChange} required style={input} />
                        <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={input} />

                        {/* Password */}
                        <div style={{ position: "relative", marginBottom: 6 }}>
                            <input
                                name="password" type={showPassword ? "text" : "password"}
                                placeholder="Password" onChange={handleChange} required
                                style={{ ...input, marginBottom: 0, paddingRight: "3rem" }}
                            />
                            <button type="button" onClick={() => setShowPassword(p => !p)}
                                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, outline: "none" }}>
                                <AnimatePresence mode="wait">
                                    {showPassword
                                        ? <motion.span key="open" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}><EyeOpen /></motion.span>
                                        : <motion.span key="closed" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}><EyeClosed /></motion.span>
                                    }
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
                                    <img src={passwordStrength.img} alt={passwordStrength.label} style={{ width: 22, height: 22, objectFit: "contain" }} />
                                    <span style={{ color: passwordStrength.color, fontSize: "0.8rem", fontWeight: "700", letterSpacing: "0.5px" }}>{passwordStrength.label}</span>
                                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: passwordStrength.label === "Weak" ? "25%" : passwordStrength.label === "Normal" ? "50%" : passwordStrength.label === "Strong" ? "75%" : "100%" }}
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
                                name="confirmPassword" type={showConfirm ? "text" : "password"}
                                placeholder="Repeat Password" onChange={handleChange} required
                                style={{ ...input, marginBottom: 0, paddingRight: "3rem" }}
                            />
                            <button type="button" onClick={() => setShowConfirm(p => !p)}
                                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, outline: "none" }}>
                                <AnimatePresence mode="wait">
                                    {showConfirm
                                        ? <motion.span key="open" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}><EyeOpen /></motion.span>
                                        : <motion.span key="closed" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}><EyeClosed /></motion.span>
                                    }
                                </AnimatePresence>
                            </button>
                        </div>

                        <AnimatePresence>
                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    style={{ color: "#ff6b6b", fontSize: "0.8rem", marginBottom: 10, marginTop: -4, paddingLeft: 4 }}
                                >❌ Passwords do not match</motion.p>
                            )}
                        </AnimatePresence>

                        <input name="mcUsername" placeholder="Minecraft Username" onChange={handleChange} style={input} />

                        {/* School Dropdown */}
                        <div style={{ position: "relative", marginBottom: 10 }}>
                            <div
                                onClick={() => { setOpenSchool(!openSchool); setOpenGrade(false); }}
                                style={{ ...dropdownBox, color: form.school ? "#FF6FAE" : "rgba(255,111,174,0.5)", marginBottom: 0 }}
                            >
                                {form.school || "Select School"}
                            </div>
                            <AnimatePresence>
                                {openSchool && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                                        style={{
                                            ...dropdownMenu,
                                            position: "absolute", top: "calc(100% + 4px)",
                                            left: 0, right: 0, zIndex: 100, maxHeight: 220, overflowY: "auto",
                                        }}
                                    >
                                        <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,111,174,0.15)" }}>
                                            <input
                                                autoFocus
                                                placeholder="🔍 Search school..."
                                                value={schoolSearch}
                                                onChange={e => setSchoolSearch(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    width: "100%", background: "rgba(255,255,255,0.07)",
                                                    border: "1px solid rgba(255,111,174,0.3)", borderRadius: 8,
                                                    padding: "6px 10px", color: "#FF6FAE", outline: "none",
                                                    fontSize: "0.85rem", boxSizing: "border-box"
                                                }}
                                            />
                                        </div>
                                        {filteredSchools.length === 0 ? (
                                            <div style={{ ...dropdownItem, color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>No schools found</div>
                                        ) : filteredSchools.map(s => (
                                            <div key={s}
                                                onClick={() => { setForm({ ...form, school: s }); setOpenSchool(false); setSchoolSearch(""); }}
                                                style={dropdownItem}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,111,174,0.2)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >{s}</div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Gender Selector */}
                        <GenderSelector
                            value={form.gender}
                            onChange={(val) => setForm(prev => ({ ...prev, gender: val }))}
                        />

                        {/* Grade Dropdown */}
                        <div onClick={() => { setOpenGrade(!openGrade); setOpenSchool(false); }} style={dropdownBox}>
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
                            type="submit" disabled={loading}
                            style={{ ...btn, opacity: loading ? 0.65 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                        >
                            {loading ? "Registering..." : "⚔ Register"}
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
    width: "100%", padding: "0.8rem", marginBottom: "1rem",
    borderRadius: 12, border: "1px solid rgba(255,111,174,0.4)",
    background: "rgba(255,255,255,0.08)", color: "#FF6FAE",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit"
};

const btn = {
    width: "100%", padding: "0.9rem", borderRadius: 14,
    border: "1px solid rgba(255,111,174,0.5)",
    background: "linear-gradient(135deg, rgba(255,111,174,0.4), rgba(255,182,193,0.2))",
    color: "#fff", cursor: "pointer", marginTop: 10,
    fontSize: "1rem", fontWeight: "600", backdropFilter: "blur(10px)"
};

const dropdownBox = {
    width: "100%", padding: "0.8rem", borderRadius: 12,
    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,111,174,0.4)",
    color: "#FF6FAE", cursor: "pointer", marginBottom: 10, boxSizing: "border-box"
};

const dropdownMenu = {
    background: "rgba(10,5,20,0.9)", backdropFilter: "blur(18px)",
    borderRadius: 12, overflow: "hidden", marginBottom: 10,
    border: "1px solid rgba(255,111,174,0.2)"
};

const dropdownItem = {
    padding: 10, color: "#fff", cursor: "pointer",
    transition: "background 0.2s", fontSize: "0.88rem"
};

export default NonUbian;