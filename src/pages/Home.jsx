import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const allNavItems = [
    { label: "About", icon: "/About.png", path: "/about" },
    { label: "Login Portal", icon: "/Portal.png", path: "/portal", hideWhenLoggedIn: true },
    { label: "Contact Staff", icon: "/Staff.png", path: "/staff" },
    { label: "Donate", icon: "/Donate.png", path: "/donate" },
    { label: "Rules", icon: "/rules.png", path: "/rules" },
    { label: "Developers", icon: "/developers.png", path: "/developers" },
];

const STATIC_GALLERY = [
    { id: "pic1", src: "/pic1.png" },
    { id: "pic2", src: "/pic2.png" },
    { id: "pic3", src: "/pic3.png" },
    { id: "pic4", src: "/pic4.png" },
    { id: "pic5", src: "/pic5.png" },
    { id: "pic6", src: "/pic6.png" },
];

const INTRO_SEEN_KEY = "udayanHomeIntroSeen";

const INTRO_QUOTES = [
    "Welcome to Udayan-SMP",
    "Build your legacy.",
    "Form alliances. Survive the grind.",
    "Rise from nothing... to legend."
];

function Home() {
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [hoveredNav, setHoveredNav] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [failedImages, setFailedImages] = useState(new Set());
    const [authChecked, setAuthChecked] = useState(false);
    const [showIntro, setShowIntro] = useState(() => {
        if (typeof window === "undefined") return true;
        return sessionStorage.getItem(INTRO_SEEN_KEY) !== "true";
    });
    const [introStep, setIntroStep] = useState(0);
    const [typedText, setTypedText] = useState("");
    const [typingDone, setTypingDone] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => { setTimeout(() => setLoaded(true), 500); }, []);

    useEffect(() => {
        initParticlesEngine(async (engine) => { await loadSlim(engine); });
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                const snap = await getDoc(doc(db, "players", u.uid));
                if (snap.exists()) {
                    setUserData(snap.data());
                    if (snap.data().isAdmin) setIsAdmin(true);
                }
            } else {
                setUser(null);
                setUserData(null);
                setIsAdmin(false);
            }
            setAuthChecked(true);
        });
        return () => unsub();
    }, []);

    const skipIntro = () => {
        sessionStorage.setItem(INTRO_SEEN_KEY, "true");
        setShowIntro(false);
    };

    useEffect(() => {
        if (!showIntro) return;
        const handleKeyDown = (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                skipIntro();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showIntro]);

    useEffect(() => {
        if (!authChecked || user || !showIntro) return;

        sessionStorage.setItem(INTRO_SEEN_KEY, "true");

        let quoteIndex = 0;
        let charIndex = 0;
        let deleting = false;
        let stopped = false;
        let timeoutId;

        const typeSpeed = 75;
        const eraseSpeed = 35;
        const holdAfterType = 1200;
        const holdAfterErase = 350;

        const runTypewriter = () => {
            if (stopped) return;
            const currentQuote = INTRO_QUOTES[quoteIndex];

            if (!deleting) {
                setTypedText(currentQuote.slice(0, charIndex + 1));
                charIndex++;
                if (charIndex >= currentQuote.length) {
                    setTypingDone(true);
                    if (quoteIndex >= INTRO_QUOTES.length - 1) {
                        timeoutId = setTimeout(() => { setShowIntro(false); }, 1800);
                        return;
                    }
                    deleting = true;
                    timeoutId = setTimeout(runTypewriter, holdAfterType);
                    return;
                }
                timeoutId = setTimeout(runTypewriter, typeSpeed);
                return;
            }

            setTypingDone(false);
            setTypedText(currentQuote.slice(0, charIndex - 1));
            charIndex--;
            if (charIndex <= 0) {
                deleting = false;
                quoteIndex++;
                setIntroStep(quoteIndex);
                timeoutId = setTimeout(runTypewriter, holdAfterErase);
                return;
            }
            timeoutId = setTimeout(runTypewriter, eraseSpeed);
        };

        setIntroStep(0);
        setTypedText("");
        setTypingDone(false);
        timeoutId = setTimeout(runTypewriter, 500);

        return () => {
            stopped = true;
            clearTimeout(timeoutId);
        };
    }, [authChecked, user, showIntro]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const snap = await getDocs(query(collection(db, "announcements"), orderBy("createdAt", "desc")));
                setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { console.error(e); }
        };
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        if (isMobile) return;
        const handleMove = (e) => {
            const dot = document.createElement("div");
            dot.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:6px;height:6px;border-radius:50%;background:#FF6FAE;pointer-events:none;box-shadow:0 0 10px #FF6FAE,0 0 20px #FF6FAE;z-index:9999;opacity:0.8;`;
            document.body.appendChild(dot);
            setTimeout(() => {
                dot.style.transition = "0.5s ease";
                dot.style.opacity = "0";
                dot.style.transform = "scale(2)";
                setTimeout(() => dot.remove(), 500);
            }, 10);
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, [isMobile]);

    const handleLogout = async () => {
        await signOut(auth);
        setShowLogoutConfirm(false);
        window.location.reload();
    };

    const handleAccountClick = () => {
        navigate(isAdmin ? "/admin-dashboard" : "/user-dashboard");
    };

    const navItems = allNavItems.filter(item => !(item.hideWhenLoggedIn && user));
    const currentProfilePicture = userData?.profilePicture;
    const sidebarOffset = isMobile ? 0 : 60;

    const visibleGallery = STATIC_GALLERY.filter(img => !failedImages.has(img.id));
    const hasLoneLast = visibleGallery.length % 2 !== 0;
    const gridGallery = hasLoneLast ? visibleGallery.slice(0, -1) : visibleGallery;
    const loneLastImg = hasLoneLast ? visibleGallery[visibleGallery.length - 1] : null;

    // ✅ FIXED: images now fill their cards with no black bars
    const galleryImageStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        display: "block",
        transition: "transform 0.4s ease",
    };

    // ✅ FIXED: card uses aspectRatio so it's always the right shape
    const galleryCardStyle = {
        borderRadius: "10px",
        border: "1px solid rgba(255,111,174,0.2)",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
        cursor: "pointer",
        aspectRatio: "16/9",
        position: "relative",
    };

    return (
        <div style={{ minHeight: "100vh", overflow: "hidden", position: "relative", fontFamily: "'Courier New', monospace" }}>

            <style>{`
    @font-face {
        font-family: "Minecraft Ten";
        src: url("/Fonts/MinecraftTen.ttf") format("truetype");
        font-weight: normal;
        font-style: normal;
        font-display: swap;
    }
    /* rest of your styles... */
`}</style>

            <AnimatePresence>
                {authChecked && !user && showIntro && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.4, ease: "easeInOut" }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 30000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "radial-gradient(circle at center, rgba(255,111,174,0.22), rgba(10,0,12,0.96) 55%, #000 100%)",
                            backdropFilter: "blur(14px)",
                            fontFamily: "'Courier New', monospace",
                            overflow: "hidden"
                        }}
                    >
                        {!isMobile && (
                            <div style={{
                                position: "absolute",
                                right: "24px",
                                bottom: "22px",
                                color: "rgba(255,255,255,0.72)",
                                fontSize: "0.78rem",
                                letterSpacing: "1px",
                                fontFamily: "'Minecraft Ten', 'Courier New', monospace",
                                textShadow: "0 0 12px rgba(255,111,174,0.6)"
                            }}>
                                Press Tab to skip intro
                            </div>
                        )}

                        {isMobile && (
                            <button
                                onClick={skipIntro}
                                style={{
                                    position: "absolute",
                                    right: "16px",
                                    bottom: "18px",
                                    padding: "0.7rem 1rem",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(255,111,174,0.55)",
                                    background: "rgba(255,111,174,0.16)",
                                    color: "#fff",
                                    fontSize: "0.75rem",
                                    fontFamily: "'Minecraft Ten', 'Courier New', monospace",
                                    cursor: "pointer",
                                    boxShadow: "0 0 18px rgba(255,111,174,0.25)"
                                }}
                            >
                                Skip Intro
                            </button>
                        )}

                        <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.6, 0.35] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: "absolute",
                                width: isMobile ? "260px" : "520px",
                                height: isMobile ? "260px" : "520px",
                                borderRadius: "50%",
                                background: "radial-gradient(circle, rgba(255,111,174,0.25), transparent 70%)",
                                boxShadow: "0 0 120px rgba(255,111,174,0.35)"
                            }}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            style={{ position: "relative", textAlign: "center", padding: "2rem", maxWidth: "720px" }}
                        >
                            <motion.img
                                src="/logo.png"
                                alt="Udayan SMP"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                style={{
                                    width: isMobile ? "150px" : "240px",
                                    imageRendering: "pixelated",
                                    marginBottom: "1.5rem",
                                    filter: "drop-shadow(0 0 24px rgba(255,111,174,0.7))"
                                }}
                            />

                            <motion.h1
                                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                transition={{ duration: 0.7 }}
                                style={{
                                    color: introStep === 0 ? "#f5c842" : "#fff",
                                    fontSize: isMobile ? "1.9rem" : "3.4rem",
                                    fontWeight: "normal",
                                    fontFamily: "'Minecraft Ten', 'Courier New', monospace",
                                    letterSpacing: "1px",
                                    textShadow: introStep === 0
                                        ? "3px 3px 0 #7a5c00, 0 0 28px rgba(245,200,66,0.45)"
                                        : "0 0 24px rgba(255,111,174,0.65)",
                                    margin: 0,
                                    lineHeight: 1.25,
                                    minHeight: isMobile ? "4.4rem" : "7.5rem"
                                }}
                            >
                                {typedText}
                                <span style={{
                                    display: "inline-block",
                                    width: "0.45em",
                                    marginLeft: "4px",
                                    color: "#FF6FAE",
                                    opacity: typingDone ? 0.7 : 1,
                                    animation: typingDone ? "cursorBlink 0.8s infinite" : "none"
                                }}>|</span>
                            </motion.h1>

                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((introStep + 1) / INTRO_QUOTES.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    height: "3px",
                                    maxWidth: "320px",
                                    margin: "1.5rem auto 0",
                                    borderRadius: "999px",
                                    background: "linear-gradient(90deg, #FF6FAE, #f5c842)"
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <video autoPlay loop muted playsInline style={{
                position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                objectFit: "cover", zIndex: 0
            }}>
                <source src="/bg.mp4" type="video/mp4" />
            </video>

            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1 }} />

            <Particles
                options={{
                    interactivity: {
                        events: { onHover: { enable: !isMobile, mode: "repulse" } },
                        modes: { repulse: { distance: 100, duration: 0.4 } }
                    },
                    particles: {
                        number: { value: isMobile ? 60 : 180 },
                        color: { value: ["#FF6FAE", "#ffb6d5", "#ffffff"] },
                        opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: 0.5 } },
                        size: { value: { min: 1, max: 3 } },
                        move: { enable: true, speed: 0.3, random: true },
                        links: { enable: false }
                    },
                    background: { color: "transparent" }
                }}
                style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2 }}
            />

            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 9999,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)"
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            style={{
                                background: "rgba(255,240,245,0.1)", backdropFilter: "blur(20px)",
                                border: "1px solid rgba(255,111,174,0.4)", borderRadius: "24px",
                                padding: "2.5rem 2rem", textAlign: "center",
                                boxShadow: "0 0 60px rgba(255,111,174,0.2)",
                                maxWidth: "380px", width: "90%"
                            }}
                        >
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👋</div>
                            <h2 style={{ color: "#fff", marginBottom: "0.5rem", fontSize: "1.2rem" }}>Leaving so soon?</h2>
                            <p style={{ color: "#ffb6d5", marginBottom: "2rem", fontSize: "0.9rem" }}>Are you sure you want to logout?</p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
                                    style={{
                                        padding: "0.7rem 1.5rem", borderRadius: "12px",
                                        border: "1px solid rgba(255,111,174,0.5)",
                                        background: "linear-gradient(135deg, rgba(255,111,174,0.5), rgba(255,182,193,0.3))",
                                        color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem"
                                    }}>Yes, Logout</motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowLogoutConfirm(false)}
                                    style={{
                                        padding: "0.7rem 1.5rem", borderRadius: "12px",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        background: "rgba(255,255,255,0.08)",
                                        color: "#fff", cursor: "pointer", fontSize: "0.9rem"
                                    }}>Cancel</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Desktop Sidebar ── */}
            {!isMobile && (
                <motion.div
                    onHoverStart={() => setNavOpen(true)}
                    onHoverEnd={() => setNavOpen(false)}
                    animate={{ width: navOpen ? 220 : 60 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: "fixed", left: 0, top: 0, height: "100vh",
                        background: "rgba(255,240,245,0.08)", backdropFilter: "blur(16px)",
                        borderRight: "1px solid rgba(255,111,174,0.3)",
                        boxShadow: "2px 0 20px rgba(255,111,174,0.1)",
                        zIndex: 100, overflow: "hidden", display: "flex",
                        flexDirection: "column", paddingTop: "20px"
                    }}
                >
                    {user && (
                        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,111,174,0.2)", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                                onClick={handleAccountClick}
                                onMouseEnter={() => setHoveredNav("account")}
                                onMouseLeave={() => setHoveredNav(null)}
                            >
                                <motion.span
                                    animate={{
                                        fontSize: hoveredNav === "account" ? "1.8rem" : "1.4rem",
                                        filter: hoveredNav === "account" ? "drop-shadow(0 0 8px #FF6FAE)" : "drop-shadow(0 0 0px transparent)"
                                    }}
                                    transition={{ duration: 0.2 }}
                                    style={{ minWidth: "36px", width: "36px", height: "36px", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                >
                                    {currentProfilePicture ? (
                                        <img src={currentProfilePicture} alt="Profile" style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "0px", imageRendering: "pixelated" }} />
                                    ) : "👤"}
                                </motion.span>
                                <AnimatePresence>
                                    {navOpen && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "bold" }}>{userData?.name || "Account"}</div>
                                            {isAdmin
                                                ? <div style={{ color: "#FF6FAE", fontSize: "0.65rem", background: "rgba(255,111,174,0.2)", borderRadius: "4px", padding: "1px 6px", display: "inline-block", marginTop: "2px" }}>ADMIN</div>
                                                : <div style={{ color: "#ffb6d5", fontSize: "0.7rem" }}>View Dashboard</div>
                                            }
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {navItems.map((item) => (
                        <div key={item.label} className="nav-item" onClick={() => navigate(item.path)}
                            onMouseEnter={() => setHoveredNav(item.label)} onMouseLeave={() => setHoveredNav(null)}
                            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", cursor: "pointer", transition: "background 0.2s", borderRadius: "8px", margin: "2px 6px" }}
                        >
                            <motion.img src={item.icon}
                                animate={{ scale: hoveredNav === item.label ? 1.35 : 1, filter: hoveredNav === item.label ? "drop-shadow(0 0 8px #FF6FAE)" : "drop-shadow(0 0 0px transparent)" }}
                                transition={{ duration: 0.2 }}
                                style={{ width: "36px", height: "36px", minWidth: "36px", objectFit: "contain", borderRadius: "6px", padding: "3px" }}
                            />
                            <AnimatePresence>
                                {navOpen && (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ color: "#fff", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {user && (
                        <div className="nav-item" onClick={() => setShowLogoutConfirm(true)}
                            onMouseEnter={() => setHoveredNav("logout")} onMouseLeave={() => setHoveredNav(null)}
                            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", cursor: "pointer", transition: "background 0.2s", borderRadius: "8px", margin: "auto 6px 20px 6px" }}
                        >
                            <motion.img src="/Logout.png"
                                animate={{ scale: hoveredNav === "logout" ? 1.35 : 1, filter: hoveredNav === "logout" ? "drop-shadow(0 0 8px #FF6FAE)" : "drop-shadow(0 0 0px transparent)" }}
                                transition={{ duration: 0.2 }}
                                style={{ width: "36px", height: "36px", minWidth: "36px", objectFit: "contain", borderRadius: "6px" }}
                            />
                            <AnimatePresence>
                                {navOpen && (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ color: "#FF6FAE", fontSize: "0.85rem", whiteSpace: "nowrap", fontWeight: "bold" }}>
                                        Logout
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── Mobile Top Bar ── */}
            {isMobile && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "rgba(10,10,10,0.85)", backdropFilter: "blur(16px)",
                    borderBottom: "1px solid rgba(255,111,174,0.25)"
                }}>
                    <img src="/logo.png" alt="logo" style={{ width: "36px", imageRendering: "pixelated" }} />
                    <button
                        onClick={() => setMobileNavOpen(v => !v)}
                        style={{
                            background: "rgba(255,111,174,0.15)", border: "1px solid rgba(255,111,174,0.4)",
                            borderRadius: "10px", padding: "8px 12px", cursor: "pointer",
                            color: "#FF6FAE", fontSize: "1.1rem", lineHeight: 1
                        }}
                    >
                        {mobileNavOpen ? "✕" : "☰"}
                    </button>
                </div>
            )}

            <AnimatePresence>
                {isMobile && mobileNavOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMobileNavOpen(false)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 150 }}
                        />
                        <motion.div
                            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{
                                position: "fixed", left: 0, top: 0, bottom: 0, width: "260px",
                                background: "rgba(10,10,10,0.97)", backdropFilter: "blur(20px)",
                                borderRight: "1px solid rgba(255,111,174,0.3)",
                                zIndex: 200, display: "flex", flexDirection: "column",
                                paddingTop: "70px", paddingBottom: "20px"
                            }}
                        >
                            {user && (
                                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,111,174,0.2)", marginBottom: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => { handleAccountClick(); setMobileNavOpen(false); }}>
                                        {currentProfilePicture
                                            ? <img src={currentProfilePicture} alt="Profile" style={{ width: "36px", height: "36px", objectFit: "cover", imageRendering: "pixelated" }} />
                                            : <span style={{ fontSize: "1.5rem" }}>👤</span>
                                        }
                                        <div>
                                            <div style={{ color: "#fff", fontSize: "0.9rem", fontWeight: "bold" }}>{userData?.name || "Account"}</div>
                                            {isAdmin
                                                ? <div style={{ color: "#FF6FAE", fontSize: "0.65rem", background: "rgba(255,111,174,0.2)", borderRadius: "4px", padding: "1px 6px", display: "inline-block" }}>ADMIN</div>
                                                : <div style={{ color: "#ffb6d5", fontSize: "0.72rem" }}>View Dashboard</div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            )}

                            {navItems.map((item) => (
                                <div key={item.label} onClick={() => { navigate(item.path); setMobileNavOpen(false); }}
                                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", cursor: "pointer", borderRadius: "10px", margin: "2px 8px" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,111,174,0.12)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <img src={item.icon} style={{ width: "32px", height: "32px", objectFit: "contain" }} alt={item.label} />
                                    <span style={{ color: "#fff", fontSize: "0.9rem" }}>{item.label}</span>
                                </div>
                            ))}

                            {user && (
                                <div onClick={() => { setShowLogoutConfirm(true); setMobileNavOpen(false); }}
                                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", cursor: "pointer", borderRadius: "10px", margin: "auto 8px 0 8px" }}
                                >
                                    <img src="/Logout.png" style={{ width: "32px", height: "32px", objectFit: "contain" }} alt="Logout" />
                                    <span style={{ color: "#FF6FAE", fontSize: "0.9rem", fontWeight: "bold" }}>Logout</span>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main Scroll Area ── */}
            <div style={{ position: "relative", zIndex: 10, overflowY: "auto", height: "100vh", marginLeft: sidebarOffset }}>

                <AnimatePresence>
                    {loaded && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
                            style={{
                                minHeight: "100vh", display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                textAlign: "center",
                                padding: isMobile ? "80px 20px 40px 20px" : "2rem"
                            }}
                        >
                            <motion.img
                                src="/logo.png"
                                initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                                style={{
                                    width: isMobile ? "180px" : "300px", maxWidth: "80vw",
                                    imageRendering: "pixelated",
                                    animation: "logofloat 3s ease-in-out infinite",
                                    marginBottom: "1.5rem"
                                }}
                            />
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                style={{
                                    fontSize: isMobile ? "2rem" : "3rem",
                                    color: "#f5c842", fontWeight: "bold",
                                    textShadow: "3px 3px 0 #7a5c00", letterSpacing: isMobile ? "2px" : "4px",
                                    marginBottom: "1rem"
                                }}
                            >
                                UDAYAN SMP
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                                style={{
                                    color: "#ffc0cb", fontSize: isMobile ? "0.85rem" : "1rem",
                                    maxWidth: "500px", lineHeight: "1.8",
                                    marginBottom: "2rem", fontWeight: "700",
                                    padding: "0 8px"
                                }}
                            >
                                <strong>
                                    Udayan SMP<br />
                                    A chill yet competitive survival world where players build, grind, and create their own legacy.<br />
                                    No pay-to-win — just pure skill, teamwork, and creativity.<br />
                                    Join events, form alliances, and explore a constantly evolving world.<br />
                                    Start from nothing… and rise to legend.
                                </strong>
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                                style={{ color: "#FF6FAE", fontSize: "0.85rem", fontWeight: "700", animation: "logofloat 2s ease-in-out infinite" }}
                            >
                                ↓ scroll to explore
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Gallery Section ── */}
                {visibleGallery.length > 0 && (
                    <div style={{ padding: isMobile ? "2rem 1rem" : "3rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>


                        {/* ✅ FIXED: 2-column grid, each card is 16:9 with cover image */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(2, minmax(0, 1fr))",
                            gap: isMobile ? "0.5rem" : "0.8rem",
                        }}>
                            {gridGallery.map((img, i) => (
                                <motion.div
                                    key={img.id}
                                    className="gallery-card"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    whileHover={{ scale: 1.03, y: -4 }}
                                    style={galleryCardStyle}
                                >
                                    <img
                                        src={img.src}
                                        alt={img.id}
                                        style={galleryImageStyle}
                                        onError={() => setFailedImages(prev => new Set([...prev, img.id]))}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* ✅ FIXED: lone last image also uses 16:9 aspect ratio */}
                        {loneLastImg && (
                            <motion.div
                                key={loneLastImg.id}
                                className="gallery-card"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: gridGallery.length * 0.07 }}
                                whileHover={{ scale: 1.03, y: -4 }}
                                style={{
                                    ...galleryCardStyle,
                                    marginTop: isMobile ? "0.5rem" : "0.8rem",
                                    width: isMobile ? "100%" : "60%",
                                    marginLeft: "auto",
                                    marginRight: "auto",
                                }}
                            >
                                <img
                                    src={loneLastImg.src}
                                    alt={loneLastImg.id}
                                    style={galleryImageStyle}
                                    onError={() => setFailedImages(prev => new Set([...prev, loneLastImg.id]))}
                                />
                            </motion.div>
                        )}
                    </div>
                )}

                {/* ── Announcements Section ── */}
                <div style={{ padding: isMobile ? "3rem 1rem" : "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
                    <h2 style={{
                        color: "#FF6FAE", textAlign: "center", fontSize: isMobile ? "1.5rem" : "2rem",
                        marginBottom: "2rem", letterSpacing: "2px",
                        textShadow: "0 0 20px rgba(255,111,174,0.5)"
                    }}>
                        ANNOUNCEMENTS
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {announcements.length === 0 ? (
                            <div style={{ background: "rgba(255,111,174,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,111,174,0.25)", borderRadius: "20px", padding: "2rem", color: "#ffb6d5", textAlign: "center" }}>
                                No announcements yet. Check back soon!
                            </div>
                        ) : announcements.map((a, i) => (
                            <motion.div key={a.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                style={{
                                    background: a.pinned ? "rgba(255,111,174,0.08)" : "rgba(255,255,255,0.04)",
                                    backdropFilter: "blur(12px)",
                                    border: `1px solid ${a.pinned ? "rgba(255,111,174,0.4)" : "rgba(255,255,255,0.1)"}`,
                                    borderRadius: "16px", padding: "1.2rem"
                                }}
                            >
                                <div style={{ color: "#fff", fontWeight: "bold", marginBottom: "0.4rem", fontSize: isMobile ? "0.9rem" : "1rem" }}>
                                    {a.pinned && <span style={{ color: "#FF6FAE", marginRight: "8px" }}>📌</span>}
                                    {a.title}
                                </div>
                                {a.description && <div style={{ color: "#aaa", fontSize: "0.83rem", lineHeight: 1.6 }}>{a.description}</div>}
                                <div style={{ color: "#555", fontSize: "0.72rem", marginTop: "0.6rem" }}>
                                    {a.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: isMobile ? "2rem 1rem" : "3rem 2rem",
                    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)",
                    borderTop: "1px solid rgba(255,111,174,0.2)", textAlign: "center"
                }}>
                    <img src="/logo.png" style={{ width: "70px", imageRendering: "pixelated", marginBottom: "1rem" }} alt="logo" />
                    <p style={{ color: "#ffb6d5", marginBottom: "1.5rem", fontSize: "0.82rem", padding: "0 1rem" }}>
                        Udayan SMP — where passion for gaming meets teamwork, skill, and future champions.
                    </p>
                    <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
                        {[
                            { label: "Instagram", icon: "/ig.png", url: "https://www.instagram.com/udayansmp?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" },
                            { label: "Discord", icon: "/dc.png", url: "https://discord.gg/2QgzqVfCVu" },
                            { label: "X", icon: "/x.png", url: "#" },
                            { label: "YouTube", icon: "/yt.png", url: "https://youtube.com/@udayansmp?si=0lXr_D81laFDzWCj" },
                        ].map((s) => (
                            <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="social-btn"
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", color: "#ffb6d5", textDecoration: "none", fontSize: "0.8rem", transition: "transform 0.2s" }}
                            >
                                <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", overflow: "hidden" }}>
                                    <img src={s.icon} alt={s.label} style={{ width: s.label === "Instagram" ? "38px" : "26px", height: s.label === "Instagram" ? "38px" : "26px", objectFit: "contain" }} />
                                </div>
                                {s.label}
                            </a>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Home;