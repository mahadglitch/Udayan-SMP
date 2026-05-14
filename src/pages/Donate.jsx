import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

function Donate() {
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);
    const [hoveredFeature, setHoveredFeature] = useState(null);
    const animFrameRef = useRef(null);

    useEffect(() => {
        setTimeout(() => setLoaded(true), 300);
    }, []);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        });
    }, []);

    // ── Mouse Trail (pure DOM, no state) ─────────────────────────
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

    const features = [
        { label: "Coming Soon" },
        { label: "Stay Tuned" },
        { label: "Support Us" }
    ];

    return (
        <div style={{ minHeight: "100vh", position: "relative", fontFamily: "'Rajdhani', 'Courier New', monospace" }}>

            <style>{`
                @keyframes glowpulse {
                    0%,100%{text-shadow:0 0 20px rgba(255,111,174,0.5);}
                    50%{text-shadow:0 0 40px rgba(255,111,174,0.9);}
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes shimmer {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .donate-card {
                    background: rgba(255, 111, 174, 0.08);
                    border: 2px solid rgba(255, 111, 174, 0.4);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    border-radius: 20px;
                    padding: 60px 40px;
                    text-align: center;
                    max-width: 600px;
                    box-shadow: 0 0 60px rgba(255, 111, 174, 0.2);
                    position: relative;
                    overflow: hidden;
                }
                .donate-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 111, 174, 0.2), transparent);
                    animation: shimmer 3s infinite;
                    pointer-events: none;
                }
                .donate-card:hover {
                    border-color: rgba(255, 111, 174, 0.8);
                    box-shadow: 0 0 80px rgba(255, 111, 174, 0.35);
                    transform: translateY(-8px);
                }
                .donate-icon {
                    font-size: 4.5rem;
                    margin-bottom: 24px;
                    animation: float 3s ease-in-out infinite;
                }
                .donate-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin-bottom: 12px;
                    letter-spacing: 0.08em;
                }
                .donate-subtitle {
                    font-size: 1rem;
                    color: #ffb6d5;
                    margin-bottom: 32px;
                    animation: glowpulse 3s ease-in-out infinite;
                    letter-spacing: 0.05em;
                }
                .feature-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 16px;
                    margin: 32px 0;
                }
                .feature-item {
                    background: rgba(255, 111, 174, 0.12);
                    border: 1px solid rgba(255, 111, 174, 0.3);
                    border-radius: 12px;
                    padding: 16px 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .feature-item:hover {
                    background: rgba(255, 111, 174, 0.25);
                    border-color: rgba(255, 111, 174, 0.7);
                    transform: scale(1.08);
                }
                .feature-icon {
                    font-size: 2rem;
                    margin-bottom: 8px;
                }
                .feature-label {
                    font-size: 0.75rem;
                    color: #ffb6d5;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
                .donate-message {
                    font-size: 1.1rem;
                    color: #e0e0e0;
                    margin-bottom: 12px;
                    line-height: 1.7;
                }
                .donate-cta {
                    display: inline-block;
                    margin-top: 24px;
                    padding: 12px 32px;
                    background: rgba(255, 111, 174, 0.2);
                    border: 2px solid rgba(255, 111, 174, 0.6);
                    border-radius: 10px;
                    color: #ffb6d5;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    letter-spacing: 0.05em;
                }
                .donate-cta:hover {
                    background: rgba(255, 111, 174, 0.35);
                    border-color: #ffb6d5;
                    box-shadow: 0 0 20px rgba(255, 111, 174, 0.4);
                }
            `}</style>

            {/* BG Video */}
            <video autoPlay loop muted style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 0,
                filter: "brightness(0.45)"
            }}>
                <source src="/bg.mp4" />
            </video>

            {/* Overlay */}
            <div style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                zIndex: 1
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
                        number: { value: 140 },
                        color: { value: ["#FF6FAE", "#ffffff"] },
                        move: { enable: true, speed: 0.3 }
                    }
                }}
                style={{ position: "fixed", inset: 0, zIndex: 2 }}
            />

            {/* Back Button */}
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

            {/* Content Container */}
            <div style={{
                position: "relative",
                zIndex: 10,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                padding: "20px"
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={loaded ? { opacity: 1, scale: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="donate-card"
                >
                    <div className="donate-icon"></div>
                    <div className="donate-title">Donation Portal</div>
                    <div className="donate-subtitle">This Feature Isn't Available Yet</div>

                    <div className="donate-message">
                        We're working hard to bring you a way to support the Udayan SMP community.
                        Something amazing is coming soon!
                    </div>

                    {/* Feature Grid */}
                    <div className="feature-grid">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                className="feature-item"
                                onHoverStart={() => setHoveredFeature(idx)}
                                onHoverEnd={() => setHoveredFeature(null)}
                                whileHover={{ scale: 1.08 }}
                            >
                                <div className="feature-icon">{feature.icon}</div>
                                <div className="feature-label">{feature.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default Donate