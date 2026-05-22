import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

function UbianModal({ onClose, onYes, onNo, onForeigner }) {
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
                            fontSize: "2rem",
                            fontWeight: "900",
                            color: "#f5c842",
                            textShadow: "3px 3px 0 #7a5c00, 0 0 30px rgba(245,200,66,0.6)",
                            marginBottom: "0.6rem",
                            lineHeight: 1.2
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
                                padding: "0.85rem 2rem",
                                borderRadius: "999px",
                                border: "1.5px solid rgba(255,111,174,0.7)",
                                background: "linear-gradient(135deg, rgba(255,111,174,0.35) 0%, rgba(255,111,174,0.15) 100%)",
                                backdropFilter: "blur(10px)",
                                color: "#fff",
                                fontWeight: "800",
                                fontSize: "0.95rem",
                                cursor: "pointer",
                                letterSpacing: "1px",
                                fontFamily: "'Courier New', monospace",
                                flex: 1,
                                position: "relative",
                                overflow: "hidden"
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
                                padding: "0.85rem 2rem",
                                borderRadius: "999px",
                                border: "1.5px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.06)",
                                backdropFilter: "blur(10px)",
                                color: "rgba(255,255,255,0.65)",
                                fontWeight: "800",
                                fontSize: "0.95rem",
                                cursor: "pointer",
                                letterSpacing: "1px",
                                fontFamily: "'Courier New', monospace",
                                flex: 1
                            }}
                        >
                            ✗ No
                        </motion.button>
                    </div>

                    {/* Divider */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem"
                    }}>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase" }}>or</span>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                    </div>

                    {/* Foreigner button — full width */}
                    <motion.button
                        className="ubian-foreigner"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={onForeigner}
                        style={{
                            width: "100%",
                            padding: "0.85rem 2rem",
                            borderRadius: "999px",
                            border: "1.5px solid rgba(100,200,255,0.45)",
                            background: "linear-gradient(135deg, rgba(100,200,255,0.12) 0%, rgba(100,200,255,0.06) 100%)",
                            backdropFilter: "blur(10px)",
                            color: "rgba(160,225,255,0.9)",
                            fontWeight: "800",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            letterSpacing: "1px",
                            fontFamily: "'Courier New', monospace",
                            position: "relative",
                            overflow: "hidden"
                        }}
                    >
                        🌍 Are you a Foreigner?
                    </motion.button>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.68rem", marginTop: "1.6rem", letterSpacing: "0.5px" }}
                    >
                        Press Esc or click outside to dismiss
                    </motion.p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function LoginPortal() {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => { await loadSlim(engine); });
    }, []);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") setShowModal(false); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
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
            dot.style.boxShadow = "0 0 10px #FF6FAE, 0 0 20px #FF69B4";
            dot.style.zIndex = 9999;
            dot.style.opacity = "0.8";
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
    }, []);

    const createRipple = (e) => {
        const button = e.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add("ripple");
        const existing = button.getElementsByClassName("ripple")[0];
        if (existing) existing.remove();
        button.appendChild(circle);
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            fontFamily: "'Courier New', monospace"
        }}>
            <AnimatePresence>
                {showModal && (
                    <UbianModal
                        onClose={() => setShowModal(false)}
                        onYes={() => { setShowModal(false); navigate("/register"); }}
                        onNo={() => { setShowModal(false); navigate("/non-ubian"); }}
                        onForeigner={() => { setShowModal(false); navigate("/bideshi"); }}
                    />
                )}
            </AnimatePresence>

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

            <style>{`
                @keyframes logofloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
                .ripple { position:absolute; border-radius:50%; transform:scale(0); animation:rippleAnim 0.6s linear; background:radial-gradient(circle,rgba(255,255,255,0.6) 0%,rgba(255,111,174,0.3) 40%,transparent 70%); pointer-events:none; }
                @keyframes rippleAnim { to { transform:scale(4); opacity:0; } }
            `}</style>

            <video autoPlay loop muted playsInline style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                objectFit: "cover", zIndex: 0, filter: "brightness(0.45)"
            }}>
                <source src="/bg.mp4" type="video/mp4" />
            </video>

            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1 }} />

            <Particles
                options={{
                    interactivity: {
                        events: { onHover: { enable: true, mode: "repulse" } },
                        modes: { repulse: { distance: 100, duration: 0.4 } }
                    },
                    particles: {
                        number: { value: 180 },
                        color: { value: "#FF6FAE" },
                        opacity: { value: { min: 0.3, max: 0.9 } },
                        size: { value: { min: 2, max: 5 } },
                        move: { enable: true, speed: 1.2, direction: "bottom", random: true, outModes: { default: "out" } },
                        wobble: { enable: true, distance: 10, speed: 5 }
                    },
                    background: { color: "transparent" }
                }}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2 }}
            />

            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                style={{ textAlign: "center", zIndex: 10, padding: "2rem" }}
            >
                <motion.img
                    src="/logo.png"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        width: "280px", maxWidth: "80vw",
                        animation: "logofloat 3s ease-in-out infinite",
                        marginBottom: "1.5rem"
                    }}
                />
                <h1 style={{
                    fontSize: "2.5rem", color: "#f5c842", fontWeight: "bold",
                    textShadow: "3px 3px 0 #7a5c00, 0 0 20px rgba(245,200,66,0.5)", marginBottom: "1rem"
                }}>
                    UDAYAN SMP
                </h1>
                <p style={{ color: "#FF6FAE", fontWeight: "700", maxWidth: "440px", margin: "0 auto 2.5rem auto" }}>
                    Where passion for gaming meets teamwork, skill, and future champions.
                </p>
                <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <motion.button
                        onClick={(e) => { createRipple(e); setShowModal(true); }}
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                        style={{
                            position: "relative", overflow: "hidden",
                            padding: "0.9rem 2.2rem", borderRadius: "999px",
                            border: "1px solid rgba(255,111,174,0.4)",
                            background: "rgba(255,111,174,0.18)", backdropFilter: "blur(12px)",
                            color: "#fff", fontWeight: "600", cursor: "pointer",
                            fontFamily: "'Courier New', monospace"
                        }}
                    >
                        ⚔ Register
                    </motion.button>
                    <motion.button
                        onClick={(e) => { createRipple(e); navigate("/login"); }}
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                        style={{
                            position: "relative", overflow: "hidden",
                            padding: "0.9rem 2.2rem", borderRadius: "999px",
                            border: "1px solid rgba(255,111,174,0.4)",
                            background: "rgba(255,111,174,0.25)", backdropFilter: "blur(12px)",
                            color: "#fff", fontWeight: "600", cursor: "pointer",
                            fontFamily: "'Courier New', monospace"
                        }}
                    >
                        🔑 Login
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

export default LoginPortal;