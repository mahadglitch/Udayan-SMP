import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Developers() {
    const navigate = useNavigate();
    const publicPath = import.meta.env.BASE_URL || "/";

    const [copiedIndex, setCopiedIndex] = useState(null);
    const [hoveredDiscord, setHoveredDiscord] = useState(null);

    const devs = [
        {
            name: "Mahad Bin Kyser",
            role: "Full Stack Developer",
            bio: "Full-stack web developer focused on creating scalable, user-friendly web applications with secure authentication, role-based access systems, and dynamic, responsive UI/UX design.",
            whatsapp: "+8801908942101",
            discord: "mahad_280511",
            image: `${publicPath}mahad.png`
        },
        {
            name: "Md. JalalUddin Arabi",
            role: "Frontend Developer",
            bio: "UI/UX designer focused on designing elegant, user-centered digital experiences. Skilled in transforming ideas into intuitive interfaces through research-driven design, wireframing, and modern visual systems.",
            whatsapp: "+8801670782357",
            discord: "md.jalal",
            image: `${publicPath}jalal.png`
        }
    ];

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
            dot.style.boxShadow = "0 0 10px #FF6FAE, 0 0 20px #FF6FAE";
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

    const openWhatsApp = (phone) => {
        window.open(`https://wa.me/${phone.replace("+", "")}`, "_blank");
    };

    const copyDiscord = async (discord, index) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(discord);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = discord;
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                textarea.style.top = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }
        } catch {
            window.prompt("Copy Discord username:", discord);
            return;
        }
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 3000);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                fontFamily: "'Courier New', monospace",
                color: "#fff",
                position: "relative",
                overflowX: "hidden"
            }}
        >
            <style>{`
                @keyframes logofloat {
                    0%, 100% { transform: translateY(0); }
                    50%       { transform: translateY(-12px); }
                }
                @media (max-width: 720px) {
                    article {
                        grid-template-columns: 1fr !important;
                        max-width: 430px;
                    }
                    article > div:first-child {
                        height: 260px !important;
                        min-height: 260px !important;
                    }
                    article > div:first-child img {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: cover !important;
                    }
                    article > div:last-child {
                        padding: 1.5rem !important;
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            <video
                autoPlay loop muted playsInline
                style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
            >
                <source src={`${publicPath}bg.mp4`} type="video/mp4" />
            </video>

            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1 }} />

            {/* Back button */}
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

            {/* Header */}
            <div style={{ position: "relative", zIndex: 2, textAlign: "center", paddingTop: "86px" }}>
                <img
                    src={`${publicPath}logo.png`}
                    alt="Udayan SMP"
                    style={{
                        width: "220px",
                        filter: "drop-shadow(0 0 28px rgba(255,111,174,0.7))",
                        marginBottom: "0.8rem",
                        animation: "logofloat 3s ease-in-out infinite",
                    }}
                />
                <h1 style={{ fontSize: "clamp(2.1rem, 6vw, 3rem)", color: "#FF6FAE", textShadow: "0 0 25px rgba(255,111,174,0.4)", margin: 0 }}>
                    DEVELOPERS
                </h1>
                <p style={{ color: "#ffb6d5", fontSize: "0.9rem", marginTop: "0.7rem" }}>
                    The minds behind Udayan SMP
                </p>
            </div>

            {/* Dev cards */}
            <div
                style={{
                    position: "relative", zIndex: 2,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: "1.8rem", padding: "2.6rem 1rem 4rem"
                }}
            >
                {devs.map((dev, i) => (
                    <motion.article
                        key={dev.name}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: i * 0.12 }}
                        whileHover={{ scale: 1.015, boxShadow: "0 0 42px rgba(255,111,174,0.22)" }}
                        style={{
                            width: "min(740px, calc(100vw - 2rem))",
                            minHeight: "210px",
                            display: "grid",
                            gridTemplateColumns: "250px 1fr",
                            gap: "0",
                            padding: "0",
                            borderRadius: "22px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,111,174,0.25)",
                            backdropFilter: "blur(14px)",
                            boxShadow: "0 0 35px rgba(255,111,174,0.15)",
                            overflow: "hidden",
                            position: "relative"
                        }}
                    >
                        {/* Image Column */}
                        <div
                            style={{
                                width: "100%", height: "100%", minHeight: "210px",
                                background: "rgba(0,0,0,0.28)", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                        >
                            <img
                                src={dev.image}
                                alt={dev.name}
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling.style.display = "flex";
                                }}
                                style={{
                                    width: "100%", height: "100%",
                                    objectFit: "cover", objectPosition: "center", display: "block",
                                    filter: "drop-shadow(0 0 14px rgba(255,111,174,0.28))"
                                }}
                            />
                            <div style={{
                                display: "none", width: "100%", height: "100%", minHeight: "180px",
                                alignItems: "center", justifyContent: "center",
                                color: "#FF6FAE", fontSize: "0.8rem", textAlign: "center", padding: "1rem"
                            }}>
                                Image not found
                            </div>
                        </div>

                        {/* Info Column */}
                        <div
                            style={{
                                padding: "1.8rem 2rem",
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: "0.8rem 1.4rem",
                                alignContent: "start"
                            }}
                        >
                            <div>
                                <h2 style={{ color: "#fff", fontSize: "1.35rem", lineHeight: 1.2, margin: 0, textShadow: "0 0 16px rgba(255,111,174,0.25)" }}>
                                    {dev.name}
                                </h2>
                                <p style={{ color: "#f5c842", fontSize: "0.85rem", margin: "0.45rem 0 1.25rem" }}>
                                    {dev.role}
                                </p>
                            </div>

                            {/* Social Icons */}
                            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", paddingTop: "0.2rem" }}>

                                {/* WhatsApp */}
                                <motion.img
                                    whileHover={{ rotate: 360, scale: 1.12 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => openWhatsApp(dev.whatsapp)}
                                    src={`${publicPath}whatsapp.png`}
                                    alt="WhatsApp"
                                    title={dev.whatsapp}
                                    style={{
                                        width: "30px", height: "30px", cursor: "pointer",
                                        filter: "drop-shadow(0 0 8px rgba(255,111,174,0.45))"
                                    }}
                                />

                                {/*
                                 * Discord — icon on the LEFT, pill slides out to the RIGHT.
                                 * Normal flex row: icon first, then the expanding pill.
                                 */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        flexDirection: "row",
                                    }}
                                    onMouseEnter={() => setHoveredDiscord(i)}
                                    onMouseLeave={() => setHoveredDiscord(null)}
                                >
                                    {/* Discord icon — always on top / left anchor */}
                                    <motion.img
                                        animate={hoveredDiscord === i
                                            ? { rotate: -360, scale: 1.18 }
                                            : { rotate: 0, scale: 1 }
                                        }
                                        transition={{ duration: 0.42 }}
                                        whileTap={{ scale: 0.88 }}
                                        onClick={() => copyDiscord(dev.discord, i)}
                                        src={`${publicPath}dc.png`}
                                        alt="Discord"
                                        style={{
                                            width: "30px",
                                            height: "30px",
                                            cursor: "pointer",
                                            position: "relative",
                                            zIndex: 2,
                                            flexShrink: 0,
                                            filter: hoveredDiscord === i
                                                ? "drop-shadow(0 0 12px rgba(255,111,174,0.9))"
                                                : "drop-shadow(0 0 8px rgba(255,111,174,0.45))"
                                        }}
                                    />

                                    {/* Username pill — grows out to the RIGHT from behind the icon */}
                                    <AnimatePresence>
                                        {hoveredDiscord === i && (
                                            <motion.div
                                                key={`discord-label-${i}`}
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: "auto", opacity: 1 }}
                                                exit={{ width: 0, opacity: 0 }}
                                                transition={{
                                                    width: {
                                                        duration: 0.38,
                                                        ease: [0.34, 1.4, 0.64, 1],
                                                    },
                                                    opacity: { duration: 0.1 },
                                                }}
                                                style={{
                                                    overflow: "hidden",
                                                    zIndex: 1,
                                                    flexShrink: 0,
                                                    marginLeft: "-2px",
                                                }}
                                            >
                                                <div
                                                    onClick={() => copyDiscord(dev.discord, i)}
                                                    style={{
                                                        whiteSpace: "nowrap",
                                                        padding: "5px 14px 5px 12px",
                                                        /* right half of a pill — flat on left to attach to icon */
                                                        borderRadius: "0 20px 20px 0",
                                                        background: copiedIndex === i
                                                            ? "rgba(100,255,180,0.18)"
                                                            : "rgba(15,8,28,0.92)",
                                                        border: copiedIndex === i
                                                            ? "1px solid rgba(100,255,180,0.6)"
                                                            : "1px solid rgba(255,111,174,0.55)",
                                                        borderLeft: "none",
                                                        color: copiedIndex === i ? "#aaffcc" : "#fff",
                                                        fontSize: "0.72rem",
                                                        fontWeight: "bold",
                                                        fontFamily: "'Courier New', monospace",
                                                        letterSpacing: "0.5px",
                                                        backdropFilter: "blur(14px)",
                                                        cursor: "pointer",
                                                        boxShadow: copiedIndex === i
                                                            ? "0 0 14px rgba(100,255,180,0.25)"
                                                            : "0 0 14px rgba(255,111,174,0.2)",
                                                        lineHeight: "1",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        height: "30px",
                                                    }}
                                                >
                                                    {copiedIndex === i ? "✓ Copied!" : dev.discord}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <p style={{
                                gridColumn: "1 / -1", color: "#ffb6d5",
                                fontSize: "0.88rem", lineHeight: "1.7", margin: 0, maxWidth: "460px"
                            }}>
                                {dev.bio}
                            </p>

                            <div style={{
                                gridColumn: "1 / -1",
                                display: "inline-block",
                                padding: "5px 13px",
                                borderRadius: "999px",
                                background: "rgba(170,255,221,0.12)",
                                border: "1px solid rgba(170,255,221,0.4)",
                                color: "#aaffdd",
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                                width: "fit-content",
                                marginTop: "0.45rem"
                            }}>
                                Freelancing: Available
                            </div>
                        </div>
                    </motion.article>
                ))}
            </div>
        </div>
    );
}