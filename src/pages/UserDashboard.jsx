import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import * as THREE from "three";

const Particles = lazy(() => import("@tsparticles/react").then(m => ({ default: m.default })));

// ─── ProfilePicCanvas: 3D head, angled by default, front on hover ─────────────
const ProfilePicCanvas = ({ skinDataUrl, staticUrl }) => {
    const canvasRef = useRef(null);
    const cleanupRef = useRef(null);
    const isHoveringRef = useRef(false);
    const currentRotRef = useRef(Math.PI * 0.25);
    const animRef = useRef(null);

    const DEFAULT_ROT = Math.PI * 0.25; // ~45° angled side view (resting)
    const FRONT_ROT = 0;               // front-facing on hover

    useEffect(() => {
        if (!skinDataUrl) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const SIZE = 110;
        canvas.width = SIZE;
        canvas.height = SIZE;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0.3, 2.8);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
        renderer.setSize(SIZE, SIZE);
        renderer.setClearColor(0x000000, 0);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const tex = new THREE.Texture(img);
            tex.needsUpdate = true;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;

            const makeMat = (u, v, w, h) => {
                const t = tex.clone();
                t.needsUpdate = true;
                t.repeat.set(w / 64, h / 64);
                t.offset.set(u / 64, 1 - (v + h) / 64);
                t.magFilter = THREE.NearestFilter;
                t.minFilter = THREE.NearestFilter;
                return new THREE.MeshLambertMaterial({ map: t, transparent: true });
            };

            const headMats = [
                makeMat(0, 8, 8, 8), makeMat(16, 8, 8, 8),
                makeMat(8, 0, 8, 8), makeMat(16, 0, 8, 8),
                makeMat(8, 8, 8, 8), makeMat(24, 8, 8, 8),
            ];
            const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), headMats);
            scene.add(head);

            const hatMats = [
                makeMat(32, 8, 8, 8), makeMat(48, 8, 8, 8),
                makeMat(40, 0, 8, 8), makeMat(48, 0, 8, 8),
                makeMat(40, 8, 8, 8), makeMat(56, 8, 8, 8),
            ].map(m => { m.alphaTest = 0.1; return m; });
            const hat = new THREE.Mesh(new THREE.BoxGeometry(1.125, 1.125, 1.125), hatMats);
            scene.add(hat);

            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            const dir = new THREE.DirectionalLight(0xffffff, 0.9);
            dir.position.set(1, 2, 3);
            scene.add(dir);

            // Start at resting angled position
            currentRotRef.current = DEFAULT_ROT;
            head.rotation.y = DEFAULT_ROT;
            hat.rotation.y = DEFAULT_ROT;
            renderer.render(scene, camera);

            const animate = () => {
                animRef.current = requestAnimationFrame(animate);
                const target = isHoveringRef.current ? FRONT_ROT : DEFAULT_ROT;
                const diff = target - currentRotRef.current;
                if (Math.abs(diff) > 0.001) {
                    currentRotRef.current += diff * 0.1;
                } else {
                    currentRotRef.current = target;
                }
                head.rotation.y = currentRotRef.current;
                hat.rotation.y = currentRotRef.current;
                renderer.render(scene, camera);
            };
            animate();

            cleanupRef.current = () => {
                cancelAnimationFrame(animRef.current);
                renderer.dispose();
            };
        };
        img.src = skinDataUrl;

        return () => cleanupRef.current?.();
    }, [skinDataUrl]);

    if (!skinDataUrl) {
        return staticUrl
            ? <img src={staticUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", background: "#1a0a2e" }} />
            : <div className="profile-pic-placeholder">👤</div>;
    }

    return (
        <canvas
            ref={canvasRef}
            width={110}
            height={110}
            onMouseEnter={() => { isHoveringRef.current = true; }}
            onMouseLeave={() => { isHoveringRef.current = false; }}
            style={{ width: "110px", height: "110px", borderRadius: "50%", display: "block", cursor: "pointer" }}
        />
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function UserDashboard() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [showLogout, setShowLogout] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [particlesReady, setParticlesReady] = useState(false);

    // Skin PFP state
    const [showSkinUpload, setShowSkinUpload] = useState(false);
    const [skinPreviewUrl, setSkinPreviewUrl] = useState(null);
    const [skinError, setSkinError] = useState("");
    const [savingPic, setSavingPic] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [skinData, setSkinData] = useState(null); // raw skin PNG dataURL for live 3D render

    const skinCanvasRef = useRef(null);
    const skinFileRef = useRef(null);
    const threeCleanup = useRef(null);
    const lastTrailTime = useRef(0);
    const threeScene = useRef(null);
    const threeCamera = useRef(null);
    const threeRenderer = useRef(null);

    // ─── Init particles deferred 500ms ───────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            initParticlesEngine(async (engine) => {
                await loadSlim(engine);
                setParticlesReady(true);
            });
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // ─── Cursor trail ─────────────────────────────────────────────────────────
    useEffect(() => {
        const handleMove = (e) => {
            const now = Date.now();
            if (now - lastTrailTime.current < 40) return;
            lastTrailTime.current = now;
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
    }, []);

    // ─── Auth + Firestore load ────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) { navigate("/portal"); return; }
            const snap = await getDoc(doc(db, "players", u.uid));
            if (snap.exists()) {
                setUserData(snap.data());
                setEditForm(snap.data());
                if (snap.data().profilePicture) setProfilePicture(snap.data().profilePicture);
                if (snap.data().skinData) setSkinData(snap.data().skinData);
            }
            const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
            const aSnap = await getDocs(q);
            setAnnouncements(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // ─── Render 3D Minecraft head in the upload modal ─────────────────────────
    const render3DHead = (skinImage) => {
        setSkinError("");
        const canvas = skinCanvasRef.current;
        if (!canvas) return;
        if (threeCleanup.current) threeCleanup.current();

        const SIZE = 300;
        canvas.width = SIZE;
        canvas.height = SIZE;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0.3, 2.8);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
        renderer.setSize(SIZE, SIZE);
        renderer.setClearColor(0x000000, 0);

        threeScene.current = scene;
        threeCamera.current = camera;
        threeRenderer.current = renderer;

        const imgEl = document.createElement("img");
        imgEl.crossOrigin = "anonymous";
        imgEl.onload = () => {
            const skinTexture = new THREE.Texture(imgEl);
            skinTexture.needsUpdate = true;
            skinTexture.magFilter = THREE.NearestFilter;
            skinTexture.minFilter = THREE.NearestFilter;

            const makeMat2 = (u, v, w, h) => {
                const t = skinTexture.clone();
                t.needsUpdate = true;
                t.repeat.set(w / 64, h / 64);
                t.offset.set(u / 64, 1 - (v + h) / 64);
                t.magFilter = THREE.NearestFilter;
                t.minFilter = THREE.NearestFilter;
                return new THREE.MeshLambertMaterial({ map: t, transparent: true });
            };

            const headMats = [
                makeMat2(0, 8, 8, 8), makeMat2(16, 8, 8, 8),
                makeMat2(8, 0, 8, 8), makeMat2(16, 0, 8, 8),
                makeMat2(8, 8, 8, 8), makeMat2(24, 8, 8, 8),
            ];
            const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), headMats);
            scene.add(head);

            const hatMats = [
                makeMat2(32, 8, 8, 8), makeMat2(48, 8, 8, 8),
                makeMat2(40, 0, 8, 8), makeMat2(48, 0, 8, 8),
                makeMat2(40, 8, 8, 8), makeMat2(56, 8, 8, 8),
            ].map(m => { m.alphaTest = 0.1; return m; });
            const hat = new THREE.Mesh(new THREE.BoxGeometry(1.125, 1.125, 1.125), hatMats);
            scene.add(hat);

            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            const dir = new THREE.DirectionalLight(0xffffff, 0.9);
            dir.position.set(1, 2, 3);
            scene.add(dir);

            renderer.render(scene, camera);

            let animId;
            const animate = () => {
                animId = requestAnimationFrame(animate);
                head.rotation.y += 0.012;
                hat.rotation.y += 0.012;
                renderer.render(scene, camera);
            };
            animate();

            setTimeout(() => {
                renderer.render(scene, camera);
                setSkinPreviewUrl(canvas.toDataURL("image/png"));
            }, 800);

            threeCleanup.current = () => {
                cancelAnimationFrame(animId);
                renderer.dispose();
            };
        };
        imgEl.src = skinImage.src;
    };

    // ─── Handle skin file upload ──────────────────────────────────────────────
    const handleSkinFile = (file) => {
        setSkinError("");
        setSkinPreviewUrl(null);
        if (!file || file.type !== "image/png") {
            setSkinError("Please upload a PNG file.");
            return;
        }
        const img = new Image();
        img.onload = () => {
            if ((img.width !== 64 || img.height !== 64) && (img.width !== 64 || img.height !== 32)) {
                setSkinError(`Invalid size (${img.width}×${img.height}). Must be 64×64 or 64×32.`);
                return;
            }
            render3DHead(img);
        };
        img.onerror = () => setSkinError("Failed to load image.");
        img.src = URL.createObjectURL(file);
    };

    // ─── Save skin snapshot + raw skin data to Firestore ─────────────────────
    const handleSkinSave = async () => {
        const canvas = skinCanvasRef.current;
        if (!canvas) return;
        setSavingPic(true);

        if (threeCleanup.current) threeCleanup.current();

        // Reset to front-facing before capturing static snapshot
        if (threeScene.current && threeCamera.current && threeRenderer.current) {
            threeScene.current.children.forEach(child => {
                if (child.isMesh) child.rotation.y = 0;
            });
            threeRenderer.current.render(threeScene.current, threeCamera.current);
        }

        await new Promise(res => setTimeout(res, 80));

        // Composite onto solid background
        const out = document.createElement("canvas");
        out.width = 300;
        out.height = 300;
        const octx = out.getContext("2d");
        octx.fillStyle = "#1a0a2e";
        octx.fillRect(0, 0, 300, 300);
        octx.drawImage(canvas, 0, 0);
        const dataUrl = out.toDataURL("image/png");

        // Convert raw skin file to dataURL so we can store and re-render live 3D
        let skinDataUrl = null;
        const rawFile = skinFileRef.current?.files[0];
        if (rawFile) {
            skinDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(rawFile);
            });
        }

        try {
            const u = auth.currentUser;
            const updateData = { profilePicture: dataUrl };
            if (skinDataUrl) updateData.skinData = skinDataUrl;

            await updateDoc(doc(db, "players", u.uid), updateData);
            setProfilePicture(dataUrl);
            if (skinDataUrl) setSkinData(skinDataUrl);
            setUserData(prev => ({ ...prev, profilePicture: dataUrl, ...(skinDataUrl && { skinData: skinDataUrl }) }));
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            setShowSkinUpload(false);
            setSkinPreviewUrl(null);
        } catch (err) {
            console.error(err);
            setSkinError("Failed to save. Try again.");
        }
        setSavingPic(false);
    };

    // ─── Save MC username ─────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            const u = auth.currentUser;
            await updateDoc(doc(db, "players", u.uid), {
                mcUsername: editForm.mcUsername,
                section: editForm.section,
            });
            setUserData(prev => ({ ...prev, mcUsername: editForm.mcUsername, section: editForm.section }));
            setSaveSuccess(true);
            setEditing(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        }
        setSaving(false);
    };

    // ─── Logout ───────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/portal");
    };

    // ─── Loading state ────────────────────────────────────────────────────────
    if (!userData) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#06030f" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: "50px", height: "50px", border: "3px solid rgba(255,111,174,0.2)", borderTop: "3px solid #FF6FAE", borderRadius: "50%" }} />
        </div>
    );

    const tabs = [
        { id: "profile", label: " Profile" },
        { id: "announcements", label: " Announcements" },
    ];

    const infoRow = (label, val) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,111,174,0.08)", gap: "1rem" }}>
            <span style={{ color: "#FF6FAE", fontSize: "0.78rem", letterSpacing: "1px" }}>{label}</span>
            <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "600" }}>{val || "N/A"}</span>
        </div>
    );

    const editInput = (label, field) => (
        <div key={field} style={{ marginBottom: "1rem" }}>
            <label style={{ color: "#FF6FAE", fontSize: "0.75rem", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>{label}</label>
            <input
                value={editForm[field] || ""}
                onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                style={{ width: "100%", padding: "0.7rem 1rem", borderRadius: "10px", border: "1px solid rgba(255,111,174,0.4)", background: "rgba(255,255,255,0.06)", color: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
        </div>
    );

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: "100vh", fontFamily: "'Courier New', monospace", position: "relative", overflow: "hidden", background: "#06030f" }}>
            <style>{`
                @keyframes logofloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                ::-webkit-scrollbar { width:6px; }
                ::-webkit-scrollbar-thumb { background:#FF6FAE; border-radius:3px; }
                .info-card { transition: transform 0.3s, box-shadow 0.3s; }
                .info-card:hover { transform: translateY(-4px); box-shadow: 0 0 40px rgba(255,111,174,0.15) !important; }
                .tab-btn:hover { background: rgba(255,111,174,0.15) !important; }
                .profile-pic-container { position: relative; width: 110px; height: 110px; border-radius: 50%; overflow: hidden; border: 3px solid rgba(255,111,174,0.5); flex-shrink: 0; box-shadow: 0 0 24px rgba(255,111,174,0.25); }
                .profile-pic-container img { width: 100%; height: 100%; object-fit: cover; background: #1a0a2e; }
                .profile-pic-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg,rgba(255,111,174,0.2),rgba(255,182,213,0.1)); display: flex; align-items: center; justify-content: center; font-size: 2rem; }
            `}</style>

            {/* VIDEO BG */}
            <video autoPlay loop muted playsInline src={`${import.meta.env.BASE_URL}bg.mp4`}
                style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, filter: "brightness(0.3)" }} />
            <div style={{ position: "fixed", inset: 0, background: "rgba(6,3,15,0.7)", zIndex: 1 }} />

            {/* PARTICLES */}
            {particlesReady && (
                <Suspense fallback={null}>
                    <Particles
                        options={{
                            particles: {
                                number: { value: 40 },
                                color: { value: ["#FF6FAE", "#ffb6d5", "#ffffff"] },
                                opacity: { value: { min: 0.05, max: 0.3 } },
                                size: { value: { min: 1, max: 2.5 } },
                                move: { enable: true, speed: 0.3, random: true },
                                links: { enable: false }
                            },
                            background: { color: "transparent" }
                        }}
                        style={{ position: "fixed", inset: 0, zIndex: 2 }}
                    />
                </Suspense>
            )}

            {/* ── LOGOUT MODAL ── */}
            <AnimatePresence>
                {showLogout && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
                        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                            style={{ background: "rgba(10,5,20,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,111,174,0.4)", borderRadius: "24px", padding: "2.5rem 3rem", textAlign: "center", boxShadow: "0 0 60px rgba(255,111,174,0.25)", maxWidth: "380px", width: "90%" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}></div>
                            <h2 style={{ color: "#fff", marginBottom: "0.5rem", fontSize: "1.3rem" }}>Leaving so soon?</h2>
                            <p style={{ color: "#ffb6d5", marginBottom: "2rem", fontSize: "0.9rem" }}>Are you sure you want to logout?</p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
                                    style={{ padding: "0.7rem 2rem", borderRadius: "12px", border: "1px solid rgba(255,111,174,0.5)", background: "linear-gradient(135deg,rgba(255,111,174,0.5),rgba(255,182,193,0.3))", color: "#fff", cursor: "pointer", fontWeight: "bold", fontFamily: "inherit" }}>
                                    Yes, Logout
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowLogout(false)}
                                    style={{ padding: "0.7rem 2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── EDIT MC USERNAME MODAL ── */}
            <AnimatePresence>
                {editing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
                        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                            style={{ background: "rgba(10,5,20,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,111,174,0.4)", borderRadius: "24px", padding: "2rem 2.5rem", boxShadow: "0 0 60px rgba(255,111,174,0.2)", maxWidth: "420px", width: "90%" }}>
                            <h2 style={{ color: "#FF6FAE", marginBottom: "1.5rem", fontSize: "1.2rem", textAlign: "center" }}> Edit Account</h2>
                            <p style={{ color: "#888", fontSize: "0.75rem", marginBottom: "1.5rem", textAlign: "center" }}>
                                You can only edit your Minecraft Username.
                            </p>
                            {editInput("Minecraft Username", "mcUsername")}
                            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving}
                                    style={{ flex: 1, padding: "0.8rem", borderRadius: "12px", border: "1px solid rgba(255,111,174,0.5)", background: "linear-gradient(135deg,rgba(255,111,174,0.5),rgba(255,182,193,0.3))", color: "#fff", cursor: "pointer", fontWeight: "bold", fontFamily: "inherit" }}>
                                    {saving ? "Saving..." : " Save"}
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setEditing(false)}
                                    style={{ flex: 1, padding: "0.8rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MINECRAFT SKIN PFP MODAL ── */}
            <AnimatePresence>
                {showSkinUpload && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
                        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                            style={{ background: "rgba(10,5,20,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,111,174,0.4)", borderRadius: "24px", padding: "2rem 2.5rem", boxShadow: "0 0 60px rgba(255,111,174,0.2)", maxWidth: "480px", width: "90%", textAlign: "center", maxHeight: "90vh", overflowY: "auto" }}>

                            <h2 style={{ color: "#FF6FAE", marginBottom: "0.5rem", fontSize: "1.2rem" }}> Set Minecraft Skin as PFP</h2>
                            <p style={{ color: "#888", fontSize: "0.75rem", marginBottom: "1.5rem" }}>Upload your 64×64 or 64×32 skin PNG — your 3D head will be your profile picture.</p>

                            {/* Drop zone */}
                            <div
                                onClick={() => skinFileRef.current?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => { e.preventDefault(); handleSkinFile(e.dataTransfer.files[0]); }}
                                style={{ border: "3px dashed rgba(255,111,174,0.45)", borderRadius: "14px", padding: "1.5rem", cursor: "pointer", marginBottom: "1.5rem", background: "rgba(255,111,174,0.04)" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>🗂️</div>
                                <div style={{ color: "#ffb6d5", fontSize: "0.82rem" }}>Drop skin PNG here or click to browse</div>
                                <div style={{ color: "#444", fontSize: "0.7rem", marginTop: "0.3rem" }}>Must be 64×64 or 64×32 pixels</div>
                            </div>
                            <input ref={skinFileRef} type="file" accept=".png,image/png" style={{ display: "none" }}
                                onChange={e => handleSkinFile(e.target.files[0])} />

                            {/* Error */}
                            {skinError && (
                                <div style={{ color: "#f87171", fontSize: "0.78rem", marginBottom: "1rem", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "8px", padding: "0.6rem" }}>
                                    {skinError}
                                </div>
                            )}

                            {/* 3D Canvas + preview */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem", marginBottom: "1.5rem" }}>
                                <canvas ref={skinCanvasRef} width={300} height={300}
                                    style={{ borderRadius: "16px", border: "1px solid rgba(255,111,174,0.3)", background: "rgba(255,111,174,0.03)", display: "block" }} />
                                {skinPreviewUrl && (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                                        <span style={{ color: "#FF6FAE", fontSize: "0.68rem", letterSpacing: "2px" }}>YOUR PFP PREVIEW</span>
                                        <img src={skinPreviewUrl} alt="pfp preview"
                                            style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid rgba(255,111,174,0.5)", imageRendering: "pixelated" }} />
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div style={{ display: "flex", gap: "0.8rem" }}>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleSkinSave}
                                    disabled={savingPic || !skinPreviewUrl}
                                    style={{ flex: 1, padding: "0.8rem", borderRadius: "12px", border: "1px solid rgba(255,111,174,0.5)", background: skinPreviewUrl ? "linear-gradient(135deg,rgba(255,111,174,0.6),rgba(255,182,213,0.4))" : "rgba(255,111,174,0.1)", color: skinPreviewUrl ? "#fff" : "#555", cursor: skinPreviewUrl ? "pointer" : "not-allowed", fontWeight: "bold", fontFamily: "inherit" }}>
                                    {savingPic ? "Saving..." : " Set as PFP"}
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => { setShowSkinUpload(false); setSkinPreviewUrl(null); setSkinError(""); if (threeCleanup.current) threeCleanup.current(); }}
                                    style={{ flex: 1, padding: "0.8rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MAIN CONTENT ── */}
            <div style={{ position: "relative", zIndex: 10, padding: "2rem 2rem 4rem", maxWidth: "1000px", margin: "0 auto", overflowY: "auto", minHeight: "100vh" }}>

                {/* HEADER */}
                <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
                        <img src="/logo.png" style={{ width: "56px", imageRendering: "pixelated", animation: "logofloat 3s ease-in-out infinite" }} />
                        <div>
                            <h1 style={{ margin: 0, fontSize: "1.6rem", letterSpacing: "3px", background: "linear-gradient(90deg,#FF6FAE,#ffb6d5,#FF6FAE)", backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 3s linear infinite" }}>
                                MY DASHBOARD
                            </h1>
                            <p style={{ margin: 0, color: "#ffb6d5", fontSize: "0.82rem" }}>
                                Welcome back, <strong style={{ color: "#fff" }}>{userData.name}</strong>
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.8rem" }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
                            style={{ padding: "0.6rem 1.3rem", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }}>
                            Home
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowLogout(true)}
                            style={{ padding: "0.6rem 1.3rem", borderRadius: "12px", background: "rgba(255,111,174,0.12)", border: "1px solid rgba(255,111,174,0.4)", color: "#FF6FAE", cursor: "pointer", fontWeight: "bold", fontFamily: "inherit", fontSize: "0.82rem" }}>
                            Logout
                        </motion.button>
                    </div>
                </motion.div>

                {/* SAVE SUCCESS TOAST */}
                <AnimatePresence>
                    {saveSuccess && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "12px", padding: "0.8rem 1.5rem", color: "#4ade80", marginBottom: "1.5rem", textAlign: "center", fontSize: "0.9rem" }}>
                            Changes saved successfully!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PLAYER BANNER */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ background: "linear-gradient(135deg,rgba(255,111,174,0.12),rgba(255,182,193,0.06))", backdropFilter: "blur(16px)", border: "1px solid rgba(255,111,174,0.3)", borderRadius: "24px", padding: "1.8rem 2rem", marginBottom: "2rem", boxShadow: "0 0 40px rgba(255,111,174,0.1)", display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>

                    {/* ── LIVE 3D PFP (angled default, front on hover) ── */}
                    <div className="profile-pic-container">
                        <ProfilePicCanvas
                            skinDataUrl={skinData || userData?.skinData || null}
                            staticUrl={profilePicture || userData?.profilePicture || null}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ color: "#FF6FAE", fontSize: "0.7rem", letterSpacing: "3px", marginBottom: "4px" }}>PLAYER</div>
                        <div style={{ color: "#fff", fontSize: "1.6rem", fontWeight: "bold", letterSpacing: "2px" }}>{userData.name}</div>
                        <div style={{ color: "#ffb6d5", fontSize: "0.82rem", marginTop: "4px" }}>⚔ {userData.mcUsername} · {userData.grade} · {userData.section}</div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { setShowSkinUpload(true); setSkinError(""); setSkinPreviewUrl(null); }}
                            style={{ marginTop: "0.8rem", padding: "0.4rem 1rem", borderRadius: "8px", border: "1px solid rgba(255,111,174,0.4)", background: "rgba(255,111,174,0.1)", color: "#FF6FAE", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit", fontWeight: "bold" }}>
                            Change Skin
                        </motion.button>
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <div style={{ padding: "0.4rem 1.2rem", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "2px", background: userData.status === "banned" ? "rgba(248,113,113,0.2)" : "rgba(74,222,128,0.15)", border: `1px solid ${userData.status === "banned" ? "rgba(248,113,113,0.4)" : "rgba(74,222,128,0.3)"}`, color: userData.status === "banned" ? "#f87171" : "#4ade80" }}>
                            {userData.status === "banned" ? " BANNED" : " ACTIVE"}
                        </div>
                        <div style={{ color: "#555", fontSize: "0.72rem", marginTop: "8px" }}>
                            Joined {userData.registeredAt ? new Date(userData.registeredAt).toLocaleDateString() : "N/A"}
                        </div>
                    </div>
                </motion.div>

                {/* TABS */}
                <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.8rem" }}>
                    {tabs.map(tab => (
                        <motion.button key={tab.id} className="tab-btn" whileTap={{ scale: 0.96 }} onClick={() => setActiveTab(tab.id)}
                            style={{ padding: "0.65rem 1.5rem", borderRadius: "12px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", background: activeTab === tab.id ? "rgba(255,111,174,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${activeTab === tab.id ? "rgba(255,111,174,0.5)" : "rgba(255,255,255,0.1)"}`, color: activeTab === tab.id ? "#FF6FAE" : "#888", fontWeight: activeTab === tab.id ? "bold" : "normal", transition: "all 0.2s" }}>
                            {tab.label}
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* PROFILE TAB */}
                    {activeTab === "profile" && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>

                                <div className="info-card" style={{ background: "rgba(255,240,245,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,111,174,0.25)", borderRadius: "20px", padding: "1.8rem 2.5rem", minWidth: "320px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.3rem" }}>
                                        <h3 style={{ color: "#FF6FAE", margin: 0, fontSize: "1rem" }}> Account Info</h3>
                                        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => setEditing(true)}
                                            style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: "1px solid rgba(255,111,174,0.4)", background: "rgba(255,111,174,0.1)", color: "#FF6FAE", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                                            Edit
                                        </motion.button>
                                    </div>
                                    {infoRow("Name", userData.name)}
                                    {infoRow("Email", userData.email)}
                                    {infoRow("MC Username", userData.mcUsername)}
                                    {infoRow("Role", userData.role)}
                                </div>

                                <div className="info-card" style={{ background: "rgba(255,240,245,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,111,174,0.25)", borderRadius: "20px", padding: "1.8rem 2.5rem" }}>
                                    <h3 style={{ color: "#FF6FAE", marginBottom: "1.3rem", fontSize: "1rem", marginTop: 0 }}> School Info</h3>
                                    {infoRow("Grade", userData.grade)}
                                    {infoRow("Section", userData.section)}
                                    {infoRow("Roll", userData.roll)}
                                    {infoRow("Student ID", userData.studentId)}
                                    {infoRow("Gender", userData.gender)}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ANNOUNCEMENTS TAB */}
                    {activeTab === "announcements" && (
                        <motion.div key="announcements" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {announcements.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "#555", padding: "3rem", background: "rgba(255,111,174,0.04)", border: "1px solid rgba(255,111,174,0.15)", borderRadius: "20px" }}>
                                        No announcements yet. Check back soon!
                                    </div>
                                ) : announcements.map((a, i) => (
                                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        style={{ background: a.pinned ? "rgba(255,111,174,0.08)" : "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: `1px solid ${a.pinned ? "rgba(255,111,174,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "16px", padding: "1.3rem 1.5rem" }}>
                                        <div style={{ color: "#fff", fontWeight: "bold", marginBottom: "0.4rem" }}>
                                            {a.pinned && <span style={{ color: "#FF6FAE", marginRight: "8px" }}></span>}
                                            {a.title}
                                        </div>
                                        {a.description && <div style={{ color: "#aaa", fontSize: "0.83rem", lineHeight: 1.6 }}>{a.description}</div>}
                                        {a.imageUrl && <img src={a.imageUrl} style={{ maxWidth: "100%", borderRadius: "10px", marginTop: "0.8rem" }} alt="" />}
                                        <div style={{ color: "#555", fontSize: "0.72rem", marginTop: "0.6rem" }}>
                                            {a.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default UserDashboard;