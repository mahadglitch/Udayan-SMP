import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const DEFAULT_RULES = [
    {
        id: 1,
        title: "No Cheating / Hacking",
        text: "Cheating, hacking, x-ray, logging into other players' accounts without permission, duping, or using unfair mods is strictly prohibited. Anyone caught will be permanently banned.",
        severity: "critical",
    },
    {
        id: 2,
        title: "Respect Everyone",
        text: "Treat all players with respect. Insults, toxic behavior, or hate speech will not be tolerated.",
        severity: "high",
    },
    {
        id: 3,
        title: "Fair PvP",
        text: "PvP is allowed, but no spawn killing or repeatedly targeting the same players.",
        severity: "medium",
    },
    {
        id: 4,
        title: "No Griefing",
        text: "Do not destroy or steal other players' builds, bases, or items.",
        severity: "critical",
    },
    {
        id: 5,
        title: "Keep the Server Clean",
        text: "Avoid laggy builds, random lava casts, or useless redstone creations that harm server performance.",
        severity: "medium",
    },
    {
        id: 6,
        title: "No Spamming / Advertising",
        text: "Keep chat clean. Sharing links or advertising other servers is strictly forbidden.",
        severity: "medium",
    },
    {
        id: 7,
        title: "Follow Staff Instructions",
        text: "Listen to Admins and the Owner. Report issues peacefully if needed.",
        severity: "high",
    },
    {
        id: 8,
        title: "Account Safety",
        text: "Keep your account secure. If a shared account breaks rules, the owner is responsible.",
        severity: "medium",
    },
    {
        id: 9,
        title: "Event Rules",
        text: "Follow all staff directions during server events. Unsportsmanlike conduct will result in disqualification.",
        severity: "medium",
    },
    {
        id: 10,
        title: "Have Fun & Be Honest",
        text: "Udayan SMP is a community — enjoy the server, play fair, and respect others.",
        severity: "low",
    },
];

const severityConfig = {
    critical: { color: "#FF4466", glow: "rgba(255,68,102,0.4)", badge: "CRITICAL", dot: "#FF4466" },
    high: { color: "#FF6FAE", glow: "rgba(255,111,174,0.3)", badge: "HIGH", dot: "#FF6FAE" },
    medium: { color: "#ffb6d5", glow: "rgba(255,182,213,0.2)", badge: "MEDIUM", dot: "#ffb6d5" },
    low: { color: "#aaffdd", glow: "rgba(170,255,221,0.15)", badge: "INFO", dot: "#aaffdd" },
};

export default function Rules() {
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);
    const [introComplete, setIntroComplete] = useState(false);
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSeverity, setFilterSeverity] = useState("all");
    const [acknowledged, setAcknowledged] = useState(false);
    const [showAckToast, setShowAckToast] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef(null);
    const animFrameRef = useRef(null);

    useEffect(() => {
        const loadTimer = setTimeout(() => setLoaded(true), 300);
        const introTimer = setTimeout(() => setIntroComplete(true), 1400);
        return () => { clearTimeout(loadTimer); clearTimeout(introTimer); };
    }, []);

    useEffect(() => {
        initParticlesEngine(async (engine) => { await loadSlim(engine); });
    }, []);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const snap = await getDoc(doc(db, "config", "rules"));
                if (snap.exists() && snap.data().list?.length > 0) {
                    setRules(snap.data().list);
                }
            } catch (e) { }
        };
        fetchRules();
    }, []);

    // ── Mouse Trail ───────────────────────────────────────────────
    useEffect(() => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden;";
        document.body.appendChild(wrap);

        const N = 22;
        const dots = [];
        const hist = Array.from({ length: N }, () => ({ x: -300, y: -300 }));
        let mx = -300, my = -300;

        for (let i = 0; i < N; i++) {
            const t = i / (N - 1);
            const sz = Math.round(12 - t * 8);
            const d = document.createElement("div");
            d.style.cssText = `
                position:absolute;
                width:${sz}px;height:${sz}px;
                border-radius:50%;
                background:radial-gradient(circle,#ffb6d5 0%,#FF6FAE 55%,transparent 100%);
                box-shadow:0 0 ${Math.round(7 - t * 5)}px rgba(255,111,174,0.85);
                opacity:${(1 - t * 0.88).toFixed(2)};
                pointer-events:none;
                transform:translate(-50%,-50%);
                will-change:left,top;
            `;
            wrap.appendChild(d);
            dots.push(d);
        }

        const onMove = (e) => { mx = e.clientX; my = e.clientY; };
        window.addEventListener("mousemove", onMove);

        const tick = () => {
            for (let i = hist.length - 1; i > 0; i--) {
                hist[i].x = hist[i - 1].x;
                hist[i].y = hist[i - 1].y;
            }
            hist[0].x = mx; hist[0].y = my;
            dots.forEach((d, i) => {
                d.style.left = hist[i].x + "px";
                d.style.top = hist[i].y + "px";
            });
            animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener("mousemove", onMove);
            cancelAnimationFrame(animFrameRef.current);
            if (document.body.contains(wrap)) document.body.removeChild(wrap);
        };
    }, []);

    // Scroll progress
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onScroll = () => {
            const prog = el.scrollTop / (el.scrollHeight - el.clientHeight);
            setScrollProgress(Math.min(prog, 1));
        };
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [loaded]);

    const filteredRules = rules.filter((r) => {
        const matchSearch =
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchFilter = filterSeverity === "all" || r.severity === filterSeverity;
        return matchSearch && matchFilter;
    });

    const handleAcknowledge = () => {
        setAcknowledged(true);
        setShowAckToast(true);
        setTimeout(() => setShowAckToast(false), 3000);
    };

    return (
        <div style={{ minHeight: "100vh", position: "relative", fontFamily: "'Courier New', monospace", overflow: "hidden" }}>

            <style>{`
                @keyframes logofloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
                @keyframes glowpulse { 0%,100%{text-shadow:0 0 20px rgba(255,111,174,0.5)} 50%{text-shadow:0 0 50px rgba(255,111,174,1)} }
                @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
                @keyframes float-badge { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-5px) rotate(1deg)} }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: #0a0a0a; }
                ::-webkit-scrollbar-thumb { background: #FF6FAE; border-radius: 3px; }
                .rule-card:hover { border-color: rgba(255,111,174,0.5) !important; }
                .severity-btn:hover { opacity: 1 !important; }
            `}</style>

            {/* SCROLL PROGRESS BAR */}
            <div style={{
                position: "fixed", top: 0, left: 0, height: "3px",
                width: `${scrollProgress * 100}%`,
                background: "linear-gradient(90deg, #FF6FAE, #f5c842)",
                zIndex: 10000, transition: "width 0.1s",
                boxShadow: "0 0 10px #FF6FAE"
            }} />

            {/* ACK TOAST */}
            <AnimatePresence>
                {showAckToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        style={{
                            position: "fixed", bottom: "2rem", left: "50%",
                            transform: "translateX(-50%)", zIndex: 99999,
                            background: "rgba(170,255,221,0.15)",
                            border: "1px solid rgba(170,255,221,0.4)",
                            borderRadius: "999px", padding: "0.7rem 2rem",
                            color: "#aaffdd", fontWeight: "bold", fontSize: "0.85rem",
                            backdropFilter: "blur(16px)",
                            boxShadow: "0 0 30px rgba(170,255,221,0.2)"
                        }}
                    >
                        Rules acknowledged! Welcome to Udayan SMP.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BG VIDEO */}
            <video autoPlay loop muted playsInline style={{
                position: "fixed", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", zIndex: 0, filter: "brightness(0.4)"
            }}>
                <source src="/bg.mp4" type="video/mp4" />
            </video>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1 }} />

            {/* Scanline */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
            }} />

            {/* Particles — repulse on hover, push on click */}
            <Particles
                options={{
                    interactivity: {
                        events: {
                            onHover: { enable: true, mode: "repulse" },
                            onClick: { enable: true, mode: "push" },
                        },
                        modes: {
                            repulse: { distance: 120, duration: 0.4 },
                            push: { quantity: 3 },
                        },
                    },
                    particles: {
                        number: { value: 120 },
                        color: { value: ["#FF6FAE", "#ffb6d5", "#f5c842"] },
                        opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 0.5 } },
                        size: { value: { min: 1, max: 2.5 } },
                        move: { enable: true, speed: 0.25, random: true },
                        links: { enable: false }
                    },
                    background: { color: "transparent" }
                }}
                style={{ position: "fixed", inset: 0, zIndex: 3 }}
            />

            {/* BACK BUTTON */}
            <motion.div
                whileHover={{ scale: 1.2, filter: "drop-shadow(0 0 10px #FF6FAE)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/")}
                style={{
                    position: "fixed", top: "18px", left: "18px", zIndex: 10000, cursor: "pointer",
                    background: "rgba(255,111,174,0.15)", backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,111,174,0.35)", borderRadius: "12px",
                    padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px"
                }}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="#FF6FAE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ color: "#FF6FAE", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>Home</span>
            </motion.div>

            {/* MAIN SCROLL CONTAINER */}
            <div ref={containerRef} style={{ position: "relative", zIndex: 10, overflowY: "auto", height: "100vh" }}>
                <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1.5rem 5rem 1.5rem" }}>

                    {/* LOGO + HEADER */}
                    <AnimatePresence>
                        {loaded && (
                            <motion.div
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                style={{ textAlign: "center", paddingTop: "80px", marginBottom: "2.5rem" }}
                            >
                                <motion.img
                                    src="/logo.png"
                                    style={{
                                        width: "170px",
                                        imageRendering: "pixelated",
                                        animation: "logofloat 3s ease-in-out infinite",
                                        filter: "drop-shadow(0 0 25px rgba(255,111,174,0.7))",
                                        marginBottom: "1.5rem",
                                        display: "block",
                                        marginLeft: "auto",
                                        marginRight: "auto"
                                    }}
                                />

                                <div style={{
                                    display: "inline-block",
                                    background: "linear-gradient(90deg, #FF6FAE, #ff9ed2, #FF6FAE)",
                                    backgroundSize: "200% auto",
                                    animation: "shimmer 3s linear infinite, float-badge 4s ease-in-out infinite",
                                    borderRadius: "50px",
                                    padding: "4px 20px",
                                    fontSize: "0.65rem",
                                    fontWeight: "900",
                                    letterSpacing: "3px",
                                    color: "#fff",
                                    textTransform: "uppercase",
                                    marginBottom: "1rem",
                                    boxShadow: "0 0 16px rgba(255,111,174,0.5)"
                                }}>
                                    ✦ Official Server Rules ✦
                                </div>

                                <h1 style={{
                                    fontSize: "2.8rem",
                                    color: "#f5c842",
                                    fontWeight: "bold",
                                    textShadow: "3px 3px 0 #7a5c00",
                                    letterSpacing: "4px",
                                    marginBottom: "0.5rem",
                                    animation: "glowpulse 4s infinite"
                                }}>
                                    SERVER RULES
                                </h1>
                                <p style={{ color: "#ffb6d5", fontSize: "0.9rem", marginBottom: "0" }}>
                                    Read carefully. Ignorance is not an excuse.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SEARCH + FILTER BAR */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            background: "rgba(255,111,174,0.07)",
                            border: "1px solid rgba(255,111,174,0.25)",
                            borderRadius: "20px",
                            padding: "1.2rem 1.5rem",
                            marginBottom: "1.5rem",
                            backdropFilter: "blur(12px)",
                            display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center"
                        }}
                    >
                        <div style={{ flex: 1, minWidth: "180px", position: "relative" }}>
                            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem" }}>🔍</span>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search rules..."
                                style={{
                                    width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.2rem",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,111,174,0.25)",
                                    color: "#fff", fontSize: "0.82rem",
                                    fontFamily: "'Courier New', monospace",
                                    outline: "none", boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {["all", "critical", "high", "medium", "low"].map((s) => (
                                <button
                                    key={s}
                                    className="severity-btn"
                                    onClick={() => setFilterSeverity(s)}
                                    style={{
                                        padding: "0.4rem 1rem",
                                        borderRadius: "999px",
                                        border: filterSeverity === s
                                            ? `1px solid ${s === "all" ? "#FF6FAE" : severityConfig[s]?.color}`
                                            : "1px solid rgba(255,255,255,0.12)",
                                        background: filterSeverity === s
                                            ? `rgba(${s === "all" ? "255,111,174" : "255,111,174"},0.2)`
                                            : "rgba(255,255,255,0.04)",
                                        color: filterSeverity === s
                                            ? (s === "all" ? "#FF6FAE" : severityConfig[s]?.color)
                                            : "rgba(255,255,255,0.4)",
                                        fontSize: "0.72rem", fontWeight: "bold",
                                        cursor: "pointer", letterSpacing: "1px",
                                        fontFamily: "'Courier New', monospace",
                                        textTransform: "uppercase",
                                        opacity: filterSeverity === s ? 1 : 0.6,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {s === "all" ? "All" : s}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* RULES CARDS */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "2.5rem" }}>
                        <AnimatePresence mode="wait">
                            {filteredRules.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ textAlign: "center", color: "#ffb6d5", padding: "3rem", fontSize: "0.9rem" }}
                                >
                                    No rules match your search. 
                                </motion.div>
                            )}
                            {filteredRules.map((rule, i) => {
                                const sev = severityConfig[rule.severity] || severityConfig.medium;
                                const isOpen = expandedId === rule.id;
                                return (
                                    <motion.div
                                        key={rule.id}
                                        initial={introComplete ? false : { opacity: 0, x: -20 }}
                                        animate={introComplete ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
                                        exit={introComplete ? false : { opacity: 0, x: 20 }}
                                        transition={introComplete ? { duration: 0 } : { delay: i * 0.04 }}
                                        className="rule-card"
                                        onClick={() => setExpandedId(isOpen ? null : rule.id)}
                                        style={{
                                            background: isOpen ? `rgba(255,111,174,0.1)` : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${isOpen ? sev.color : "rgba(255,111,174,0.18)"}`,
                                            borderRadius: "18px",
                                            padding: "1.2rem 1.5rem",
                                            cursor: "pointer",
                                            backdropFilter: "blur(12px)",
                                            transition: "all 0.15s ease",
                                            boxShadow: isOpen ? `0 0 30px ${sev.glow}` : "none",
                                            position: "relative", overflow: "hidden"
                                        }}
                                    >
                                        <div style={{
                                            position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
                                            background: sev.color,
                                            borderRadius: "18px 0 0 18px",
                                            boxShadow: `0 0 10px ${sev.color}`
                                        }} />

                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingLeft: "0.6rem" }}>
                                            <div style={{
                                                minWidth: "32px", height: "32px",
                                                borderRadius: "8px",
                                                background: `rgba(255,111,174,0.12)`,
                                                border: `1px solid rgba(255,111,174,0.3)`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#FF6FAE", fontSize: "0.75rem", fontWeight: "900"
                                            }}>
                                                {String(rule.id).padStart(2, "0")}
                                            </div>

                                            <span style={{ fontSize: "1.5rem" }}>{rule.icon}</span>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: "#fff", fontWeight: "bold", fontSize: "0.95rem" }}>{rule.title}</div>
                                                {!isOpen && (
                                                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", marginTop: "2px" }}>
                                                        Click to expand
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{
                                                padding: "3px 10px", borderRadius: "999px",
                                                background: `${sev.glow}`,
                                                border: `1px solid ${sev.color}`,
                                                color: sev.color, fontSize: "0.6rem",
                                                fontWeight: "900", letterSpacing: "1.5px",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {sev.badge}
                                            </div>

                                            <motion.span
                                                animate={{ rotate: isOpen ? 180 : 0 }}
                                                transition={{ duration: 0.25 }}
                                                style={{ color: "#FF6FAE", fontSize: "0.8rem" }}
                                            >
                                                ▼
                                            </motion.span>
                                        </div>

                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    style={{ overflow: "hidden" }}
                                                >
                                                    <div style={{
                                                        paddingTop: "1rem",
                                                        paddingLeft: "calc(0.6rem + 32px + 1rem + 1.5rem + 1rem)",
                                                        color: "#ffb6d5", fontSize: "0.88rem",
                                                        lineHeight: "1.7", borderTop: "1px solid rgba(255,111,174,0.15)",
                                                        marginTop: "0.8rem"
                                                    }}>
                                                        {rule.text}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* ACKNOWLEDGE BUTTON */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
                        transition={{ delay: 0.6 }}
                        style={{ textAlign: "center", marginBottom: "3rem" }}
                    >
                        {!acknowledged ? (
                            <motion.button
                                whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(255,111,174,0.5)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAcknowledge}
                                style={{
                                    padding: "1rem 3rem",
                                    borderRadius: "999px",
                                    border: "1.5px solid rgba(255,111,174,0.6)",
                                    background: "linear-gradient(135deg, rgba(255,111,174,0.3), rgba(255,111,174,0.1))",
                                    backdropFilter: "blur(12px)",
                                    color: "#fff", fontWeight: "bold", fontSize: "0.95rem",
                                    cursor: "pointer", letterSpacing: "2px",
                                    fontFamily: "'Courier New', monospace",
                                    boxShadow: "0 0 20px rgba(255,111,174,0.2)"
                                }}
                            >
                                ✦ I Have Read & Agree to All Rules ✦
                            </motion.button>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.7rem",
                                    padding: "1rem 2.5rem",
                                    borderRadius: "999px",
                                    border: "1.5px solid rgba(170,255,221,0.5)",
                                    background: "rgba(170,255,221,0.1)",
                                    color: "#aaffdd", fontWeight: "bold", fontSize: "0.9rem",
                                    letterSpacing: "1px"
                                }}
                            >
                                <span style={{ fontSize: "1.2rem" }}></span> Rules Acknowledged — Play Fair!
                            </motion.div>
                        )}
                    </motion.div>

                    {/* FOOTER QUOTE */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: loaded ? 1 : 0 }}
                        transition={{ delay: 0.8 }}
                        style={{
                            textAlign: "center",
                            borderTop: "1px solid rgba(255,111,174,0.15)",
                            paddingTop: "2rem",
                            color: "rgba(255,182,213,0.4)",
                            fontSize: "0.78rem", letterSpacing: "1px"
                        }}
                    >
                        Rules may be updated by staff at any time. Last changes take effect immediately.<br />

                    </motion.div>

                </div>
            </div>
        </div>
    );
}