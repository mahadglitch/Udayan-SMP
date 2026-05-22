import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import "../App.css";

const ig = "/ig.png";
const dc = "/dc.png";
const himayt = "/himayt.png";
const whatsapp = "/whatsapp.png";
const logo = "/udayan.png";

const clickSound = typeof Audio !== "undefined" ? new Audio("/click.mp3") : null;
const playClick = () => {
    if (!clickSound) return;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => { });
};

const STAFF_OWNER = {
    id: "udayan",
    name: "Udayan SMP",
    avatar: "/logo.png",
    role: "Owner · Admin · Mastermind",
    desc: "The founder and sole architect of this universe. Every system, every rule, every pixel of this server exists because of his vision. He built it from nothing — and turned it into something legendary.",
    badges: [
        { label: "Owner", color: "#f5c842" },
        { label: "Admin", color: "#FF6FAE" },
        { label: "Founder", color: "#ffb6d5" },
    ],
    socials: [
        { type: "link", icon: ig, href: "https://www.instagram.com/udayansmp", label: "Instagram" },
        { type: "copy", icon: dc, reveal: "udayansmp", label: "Discord" },
    ],
    special: true,
};

const STAFF = [
    {
        id: "mahad",
        name: "Mahad",
        avatar: "/nyrixx.png",
        role: "Admin · Support Lead",
        desc: "The backbone of moderation. Nyrixx keeps the server clean, handles reports with precision, and is always there when players need help. Cool-headed under pressure.",
        badges: [
            { label: "Admin", color: "#FF6FAE" },
            { label: "Support", color: "#ffb6d5" },
        ],
        socials: [
            { type: "copy", icon: dc, reveal: "mahad_280511", label: "Discord" },
            { type: "copy", icon: whatsapp, reveal: "+8801908942101", label: "WhatsApp" },
        ],
        special: false,
    },
    {
        id: "himadree",
        name: "Fontaz_h",
        avatar: "/hima.png",
        role: "Admin · Creative Director",
        desc: "The creative force behind the server's identity. Fontaz shapes community aesthetics, sparks event ideas, and makes sure the vibe stays elite. Art meets gameplay.",
        badges: [
            { label: "Admin", color: "#FF6FAE" },
            { label: "Creative", color: "#ffb6d5" },
        ],
        socials: [
            { type: "link", icon: ig, href: "https://www.instagram.com/gwfonta?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", label: "Instagram" },
            { type: "link", icon: himayt, href: "https://www.youtube.com/@FONTAZ_H", label: "YouTube" },
        ],
        special: false,
    },
    {
        id: "fon",
        name: "Himadree",
        avatar: "/fon.png",
        role: "Discord Server Builder · Admin",
        desc: "The architect behind the Discord. Fon engineered the server's structure from the ground up — channels, roles, bots, and every category in between. A legend in his own right.",
        badges: [
            { label: "Server Builder", color: "#7289DA" },
            { label: "Admin", color: "#ffb6d5" },
        ],
        socials: [
            { type: "link", icon: ig, href: "https://www.instagram.com/real_himadrid?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", label: "Instagram" },
            { type: "copy", icon: dc, reveal: "fontaz_h", label: "Discord" },
        ],
        special: false,
    },
];

function useTilt(ref) {
    const handleMove = useCallback((e) => {
        const el = ref.current;
        if (!el) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale(1.04)`;
    }, [ref]);

    const handleLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)";
    }, [ref]);

    return { onMouseMove: handleMove, onMouseLeave: handleLeave };
}

function SocialIcon({ s }) {
    const [show, setShow] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (s.reveal) {
            navigator.clipboard.writeText(s.reveal).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    if (s.type === "link") {
        return (
            <a href={s.href} target="_blank" rel="noreferrer" className="sp-social-wrap" aria-label={s.label}>
                <motion.img
                    src={s.icon}
                    className="sp-social-icon"
                    whileHover={{ rotate: 360, scale: 1.25 }}
                    transition={{ duration: 0.5 }}
                />
            </a>
        );
    }

    if (s.type === "copy") {
        return (
            <div
                className="sp-social-wrap"
                onClick={handleCopy}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                style={{ position: "relative", cursor: "pointer" }}
            >
                <motion.img
                    src={s.icon}
                    className="sp-social-icon"
                    whileHover={{ rotate: 360, scale: 1.25 }}
                    transition={{ duration: 0.5 }}
                />
                <AnimatePresence>
                    {(show || copied) && (
                        <motion.div
                            className="sp-reveal"
                            initial={{ opacity: 0, y: 6, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            style={copied ? {
                                background: "rgba(80,200,120,0.95)",
                                color: "#fff",
                                borderColor: "rgba(80,200,120,0.5)",
                                boxShadow: "0 0 12px rgba(80,200,120,0.5)"
                            } : {}}
                        >
                            {copied ? "✓ Copied!" : s.reveal}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // hover type (fallback)
    return (
        <div
            className="sp-social-wrap"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            style={{ position: "relative" }}
        >
            <motion.img
                src={s.icon}
                className="sp-social-icon"
                whileHover={{ rotate: 360, scale: 1.25 }}
                transition={{ duration: 0.5 }}
            />
            <AnimatePresence>
                {show && (
                    <motion.div
                        className="sp-reveal"
                        initial={{ opacity: 0, y: 6, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                    >
                        {s.reveal}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StaffCard({ member, index, isOwner }) {
    const ref = useRef(null);
    const tilt = useTilt(ref);

    return (
        <motion.div
            className={`sp-card ${member.special ? "sp-card-special" : ""} ${isOwner ? "sp-card-owner" : ""}`}
            ref={ref}
            {...tilt}
            onClick={playClick}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + index * 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ transition: "transform 0.12s ease" }}
        >
            {member.special && <div className="sp-glow-ring" />}

            <div className="sp-card-inner">
                <div className={`sp-avatar ${member.special ? "sp-avatar-special" : ""}`}>
                    <img
                        src={member.avatar}
                        alt={member.name}
                        className={`sp-avatar-img sp-avatar-img-${member.id}`}
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                </div>

                <h2 className={`sp-name ${member.special ? "sp-name-special" : ""}`}>{member.name}</h2>
                <p className={`sp-role ${member.special ? "sp-role-special" : ""}`}>{member.role}</p>

                <div className="sp-badges">
                    {member.badges.map(b => (
                        <span key={b.label} className="sp-badge" style={{ "--bc": b.color }}>
                            {b.label}
                        </span>
                    ))}
                </div>

                <p className="sp-desc">{member.desc}</p>

                <div className="sp-socials">
                    {member.socials.map(s => <SocialIcon key={s.label} s={s} />)}
                </div>
            </div>
        </motion.div>
    );
}

const INTRO = "Initializing Udayan SMP Staff Panel...";

function TypingIntro() {
    const [text, setText] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        let i = 0;
        const t = setInterval(() => {
            setText(INTRO.slice(0, i + 1));
            i++;
            if (i >= INTRO.length) {
                clearInterval(t);
                setDone(true);
            }
        }, 55);

        return () => clearInterval(t);
    }, []);

    return (
        <motion.div className="sp-typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <span>{text}</span>
            <span className={`sp-cursor ${done ? "sp-cursor-blink" : ""}`} />
        </motion.div>
    );
}

function MouseTrail() {
    useEffect(() => {
        const onMove = (e) => {
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

        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    return null;
}

export default function Staff() {
    const navigate = useNavigate();
    const [particlesReady, setParticlesReady] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => setParticlesReady(true));
    }, []);

    return (
        <div className="sp-page">
            <style>{`
                .sp-page {
                    height: 100vh;
                    min-height: 100vh;
                    overflow: hidden;
                    position: relative;
                }

                .sp-content {
                    position: relative;
                    z-index: 10;
                    height: 100vh;
                    overflow-y: auto;
                    overflow-x: hidden;
                    scrollbar-width: thin;
                    scrollbar-color: #FF6FAE rgba(10, 10, 10, 0.7);
                }

                .sp-content::-webkit-scrollbar {
                    width: 9px;
                }

                .sp-content::-webkit-scrollbar-track {
                    background: rgba(10, 10, 10, 0.7);
                    border-left: 1px solid rgba(255, 111, 174, 0.12);
                }

                .sp-content::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #FF6FAE, #ffb6d5);
                    border-radius: 999px;
                    border: 2px solid rgba(10, 10, 10, 0.7);
                    box-shadow: 0 0 14px rgba(255, 111, 174, 0.75);
                }

                .sp-content::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #ff8fc1, #ffffff);
                }

                .sp-cards-owner-row {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                }

                .sp-card-owner {
                    max-width: 380px;
                    width: 100%;
                }

                .sp-cards {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 2rem;
                    padding: 0 2rem 4rem;
                }

                .sp-avatar {
                    width: 120px;
                    height: 120px;
                    margin: -0.4rem auto -0.2rem;
                    overflow: visible;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                }

                .sp-avatar-img {
                    width: 92px;
                    height: 62px;
                    object-fit: contain;
                    display: block;
                    image-rendering: pixelated;
                    position: relative;
                    z-index: 2;
                }

                .sp-avatar-special {
                    width: 140px;
                    height: 90px;
                    margin: -0.2rem auto 0.15rem;
                    overflow: visible;
                }

                .sp-avatar-special .sp-avatar-img {
                    width: 130px;
                    height: 80px;
                    object-fit: contain;
                }

                .sp-avatar-img-himadree {
                    width: 105px;
                    height: 105px;
                    object-fit: contain;
                }

                .sp-avatar-img-mahad {
                    width: 150px;
                    height: 150px;
                    object-fit: contain;
                }

                .sp-avatar-img-fon {
                    width: 110px;
                    height: 110px;
                    object-fit: contain;
                    border-radius: 12px;
                }
            `}</style>

            <MouseTrail />

            <motion.div
                whileHover={{ scale: 1.2, filter: "drop-shadow(0 0 10px #FF6FAE)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/")}
                style={{
                    position: "fixed",
                    top: "18px",
                    left: "18px",
                    zIndex: 10000,
                    cursor: "pointer",
                    background: "rgba(255,111,174,0.15)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,111,174,0.35)",
                    borderRadius: "12px",
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M15 18L9 12L15 6"
                        stroke="#FF6FAE"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <span style={{ color: "#FF6FAE", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>
                    Home
                </span>
            </motion.div>

            <video autoPlay loop muted playsInline className="sp-video-bg">
                <source src="/bg.mp4" type="video/mp4" />
            </video>

            <div className="sp-overlay" />

            {particlesReady && (
                <Particles
                    className="sp-particles"
                    options={{
                        background: { color: "transparent" },
                        particles: {
                            number: { value: 180 },
                            color: { value: ["#FF6FAE", "#ffb6d5", "#ffffff"] },
                            opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: 0.5 } },
                            size: { value: { min: 1, max: 3 } },
                            move: { enable: true, speed: 0.3, random: true },
                            links: { enable: false },
                        },
                        interactivity: {
                            events: { onHover: { enable: true, mode: "repulse" } },
                            modes: { repulse: { distance: 100, duration: 0.4 } },
                        },
                    }}
                />
            )}

            <div className="sp-content">
                <header className="sp-header">
                    <motion.img
                        src={logo}
                        className="sp-logo"
                        animate={{ y: [0, -12, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        onError={e => { e.target.style.display = "none"; }}
                    />

                    <TypingIntro />

                    <motion.h1
                        className="sp-title"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.7 }}
                    >
                        Meet the <span className="sp-title-accent">Staff</span>
                    </motion.h1>

                    <motion.p
                        className="sp-subtitle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        The team that keeps Udayan SMP alive, fair, and legendary.
                    </motion.p>
                </header>

                {/* Owner card — featured on top, centered */}
                <div className="sp-cards-owner-row">
                    <StaffCard member={STAFF_OWNER} index={0} isOwner={true} />
                </div>

                {/* Three staff cards below */}
                <main className="sp-cards">
                    {STAFF.map((member, i) => (
                        <StaffCard key={member.id} member={member} index={i + 1} isOwner={false} />
                    ))}
                </main>
            </div>
        </div>
    );
}