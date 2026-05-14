import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const topCards = [
    {
        icon: "",
        title: "What is Udayan SMP?",
        text: "A private SMP where Udayan High School players explore, build, and survive together, creating stories, rivalries, and unforgettable adventures in one shared world."
    },
    {
        icon: "",
        title: "Our World",
        text: "A shared Minecraft universe shaped by creativity, teamwork, and chaos — growing with every build, adventure, and story."
    },
    {
        icon: "",
        title: "Our Community",
        text: "A close-knit group of students built on friendship, respect, and teamwork — creating unforgettable moments in-game and beyond."
    }
];

const bottomCards = [
    {
        icon: "",
        title: "How to Join",
        text: "Register on the official website to get whitelisted. Udayan students can apply directly. To invite non-school players, contact staff for approval."
    },
    {
        icon: "",
        title: "Events & Seasons",
        text: "Seasonal events, tournaments, and challenges where players compete, earn titles, and make SMP history."
    }
];

function About() {
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const animFrameRef = useRef(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => { setTimeout(() => setLoaded(true), 300); }, []);

    useEffect(() => {
        initParticlesEngine(async (engine) => { await loadSlim(engine); });
    }, []);

    // Mouse trail — desktop only
    useEffect(() => {
        if (isMobile) return;

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
    }, [isMobile]);

    return (
        <div style={{ minHeight: "100vh", position: "relative", fontFamily: "'Courier New', monospace", overflowX: "hidden" }}>

            <style>{`
                @keyframes glowpulse {
                    0%,100%{text-shadow:0 0 20px rgba(255,111,174,0.5);}
                    50%{text-shadow:0 0 40px rgba(255,111,174,0.9);}
                }
                @keyframes logofloat {
                    0%,100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                .about-card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .about-card:hover {
                    transform: translateY(-6px) scale(1.02);
                    box-shadow: 0 0 40px rgba(255,111,174,0.2);
                }
            `}</style>

            {/* BG VIDEO */}
            <video autoPlay loop muted playsInline style={{
                position: "fixed", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", zIndex: 0, filter: "brightness(0.45)"
            }}>
                <source src="/bg.mp4" />
            </video>

            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1 }} />

            <Particles
                options={{
                    interactivity: {
                        events: {
                            onHover: { enable: !isMobile, mode: "repulse" },
                            onClick: { enable: true, mode: "push" },
                        },
                        modes: {
                            repulse: { distance: 120, duration: 0.4 },
                            push: { quantity: 3 },
                        },
                    },
                    particles: {
                        number: { value: isMobile ? 50 : 140 },
                        color: { value: ["#FF6FAE", "#ffffff"] },
                        move: { enable: true, speed: 0.3 }
                    }
                }}
                style={{ position: "fixed", inset: 0, zIndex: 2 }}
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

            {/* MAIN CONTENT */}
            <div style={{ position: "relative", zIndex: 10, textAlign: "center", overflowY: "auto" }}>

                {/* LOGO */}
                {loaded && (
                    <motion.img
                        src="/logo.png"
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            width: isMobile ? "100px" : "150px",
                            marginTop: isMobile ? "80px" : "100px",
                            marginBottom: "20px",
                            animation: "logofloat 3s ease-in-out infinite",
                            filter: "drop-shadow(0 0 20px #FF6FAE)"
                        }}
                    />
                )}

                {/* HERO CARD */}
                <div style={{
                    maxWidth: "900px",
                    margin: "0 auto 40px",
                    padding: isMobile ? "1.5rem 1.2rem" : "3rem",
                    borderRadius: "20px",
                    background: "rgba(255,111,174,0.08)",
                    border: "1px solid rgba(255,111,174,0.3)",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 0 60px rgba(255,111,174,0.15)",
                    marginLeft: isMobile ? "1rem" : "auto",
                    marginRight: isMobile ? "1rem" : "auto",
                }}>
                    <h1 style={{
                        color: "#FF6FAE",
                        fontSize: isMobile ? "1.6rem" : "2.5rem",
                        marginBottom: "1.2rem",
                        animation: "glowpulse 3s infinite",
                        lineHeight: 1.3
                    }}>
                        ABOUT UDAYAN SMP
                    </h1>

                    <p style={{
                        color: "#ffb6d5",
                        lineHeight: "1.9",
                        fontSize: isMobile ? "0.82rem" : "1rem",
                        textAlign: isMobile ? "left" : "center"
                    }}>
                        Udayan SMP is a private survival multiplayer Minecraft server built for students of our school to explore, create, and connect in a shared world. It's not just about surviving — it's about building something meaningful together.

                        <br /><br />

                        Whether you're constructing massive bases, forming teams, trading resources, or just chilling with friends, Udayan SMP gives you a space to express your creativity and teamwork.

                        <br /><br />

                        With a friendly community, active moderation, and a focus on fair play, the server stays fun and balanced for everyone.

                        <br /><br />

                        Join in, make your mark, and be part of something that grows every day.
                    </p>
                </div>

                {/* TOP CARDS */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: "1rem",
                    padding: isMobile ? "0 1rem" : "0 2rem",
                }}>
                    {topCards.map((card, i) => (
                        <div key={i} className="about-card" style={{
                            width: isMobile ? "100%" : "280px",
                            padding: isMobile ? "1.2rem" : "2rem",
                            borderRadius: "20px",
                            background: "rgba(255,111,174,0.06)",
                            border: "1px solid rgba(255,111,174,0.25)",
                            color: "#ffb6d5",
                            backdropFilter: "blur(10px)",
                            textAlign: "left",
                            boxSizing: "border-box"
                        }}>
                            <div style={{ fontSize: isMobile ? "1.5rem" : "2rem", marginBottom: "0.6rem" }}>{card.icon}</div>
                            <h3 style={{ color: "#FF6FAE", marginBottom: "0.5rem", fontSize: isMobile ? "0.95rem" : "1rem" }}>{card.title}</h3>
                            <p style={{ fontSize: isMobile ? "0.8rem" : "0.9rem", lineHeight: "1.6", margin: 0 }}>{card.text}</p>
                        </div>
                    ))}
                </div>

                {/* BOTTOM CARDS */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: "4rem",
                    padding: isMobile ? "0 1rem" : "0 2rem",
                }}>
                    {bottomCards.map((card, i) => (
                        <div key={i} className="about-card" style={{
                            width: isMobile ? "100%" : "280px",
                            padding: isMobile ? "1.2rem" : "2rem",
                            borderRadius: "20px",
                            background: "rgba(255,111,174,0.06)",
                            border: "1px solid rgba(255,111,174,0.25)",
                            color: "#ffb6d5",
                            backdropFilter: "blur(10px)",
                            textAlign: "left",
                            boxSizing: "border-box"
                        }}>
                            <div style={{ fontSize: isMobile ? "1.5rem" : "2rem", marginBottom: "0.6rem" }}>{card.icon}</div>
                            <h3 style={{ color: "#FF6FAE", marginBottom: "0.5rem", fontSize: isMobile ? "0.95rem" : "1rem" }}>{card.title}</h3>
                            <p style={{ fontSize: isMobile ? "0.8rem" : "0.9rem", lineHeight: "1.6", margin: 0 }}>{card.text}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

export default About;