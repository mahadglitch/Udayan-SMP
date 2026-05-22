import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import AnalyticsPanel from "../components/admin/AnalyticsPanel";
import UsersPanel from "../components/admin/UsersPanel";
import AnnouncementsPanel from "../components/admin/AnnouncementsPanel";
import ActivityLog from "../components/admin/ActivityLog";
import RulesPanel from "../components/admin/RulesPanel";
import { getAllUsers, getAnnouncements, getActivityLogs } from "../services/adminService";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
 
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,111,174,0.4); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #FF6FAE; }
 
  select option { background: #0d0d14; color: #fff; }
 
  @keyframes gridPulse {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.07; }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(255,111,174,0.3), 0 0 60px rgba(255,111,174,0.1); }
    50% { box-shadow: 0 0 40px rgba(255,111,174,0.6), 0 0 80px rgba(255,111,174,0.2); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes floatUp {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes noiseTick {
    0%   { clip-path: inset(40% 0 61% 0); }
    20%  { clip-path: inset(92% 0 1% 0); }
    40%  { clip-path: inset(43% 0 1% 0); }
    60%  { clip-path: inset(25% 0 58% 0); }
    80%  { clip-path: inset(54% 0 7% 0); }
    100% { clip-path: inset(58% 0 43% 0); }
  }

  /* ── Mobile nav bar ── */
  .admin-sidebar-desktop {
    display: flex;
  }
  .admin-bottomnav {
    display: none;
  }
  .admin-main {
    margin-left: 72px;
    padding: 2.5rem;
  }

  @media (max-width: 640px) {
    .admin-sidebar-desktop {
      display: none !important;
    }
    .admin-bottomnav {
      display: flex !important;
    }
    .admin-main {
      margin-left: 0 !important;
      padding: 1rem 0.85rem 5.5rem 0.85rem !important;
    }
    .admin-header-title {
      font-size: 1.2rem !important;
    }
    .admin-header-badge span {
      display: none;
    }
  }
`;

function AdminDashboard() {
    const navigate = useNavigate();
    const [adminData, setAdminData] = useState(null);
    const [activePanel, setActivePanel] = useState("analytics");
    const [users, setUsers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadData = async () => {
        const [u, a, l] = await Promise.all([
            getAllUsers(), getAnnouncements(), getActivityLogs()
        ]);
        setUsers(u);
        setAnnouncements(a);
        setLogs(l);
    };

    const promoteUser = async (uid) => {
        try {
            await updateDoc(doc(db, "players", uid), { isAdmin: true, role: "admin" });
            await loadData();
            showToast("User promoted to Admin", "success");
        } catch (e) {
            console.error(e);
            showToast("Failed to promote user", "error");
        }
    };

    const demoteUser = async (uid) => {
        try {
            await updateDoc(doc(db, "players", uid), { isAdmin: false, role: "user" });
            await loadData();
            showToast("User demoted to Player", "info");
        } catch (e) {
            console.error(e);
            showToast("Failed to demote user", "error");
        }
    };

    const deleteUser = async (uid) => {
        try {
            await deleteDoc(doc(db, "players", uid));
            await loadData();
            showToast("Account deleted", "error");
        } catch (e) {
            console.error(e);
            showToast("Failed to delete account", "error");
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) { navigate("/login"); return; }
            const snap = await getDoc(doc(db, "players", u.uid));
            if (snap.exists()) setAdminData(snap.data());
            await loadData();
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    if (loading) return (
        <div style={{
            minHeight: "100vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#060609", gap: "1.5rem",
            fontFamily: "'Space Mono', monospace"
        }}>
            <style>{GLOBAL_STYLES}</style>
            <div style={{
                position: "fixed", inset: 0, zIndex: 0,
                backgroundImage: `
                    linear-gradient(rgba(255,111,174,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,111,174,0.05) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
                animation: "gridPulse 4s ease-in-out infinite"
            }} />
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{
                    position: "relative", zIndex: 1,
                    width: "56px", height: "56px",
                    border: "2px solid rgba(255,111,174,0.1)",
                    borderTop: "2px solid #FF6FAE",
                    borderRight: "2px solid rgba(255,111,174,0.4)",
                    borderRadius: "50%",
                    boxShadow: "0 0 30px rgba(255,111,174,0.3)"
                }}
            />
            <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                    position: "relative", zIndex: 1,
                    color: "#FF6FAE", fontSize: "0.75rem",
                    letterSpacing: "0.3em", textTransform: "uppercase"
                }}
            >
                Initializing Admin Core
            </motion.p>
        </div>
    );

    const panelTitle = {
        analytics: "Analytics",
        users: "User Management",
        announcements: "Announcements",
        logs: "Activity Log",
        rules: "Rules Manager",
    };

    const NAV_ITEMS = [
        { id: "analytics", icon: "◈", label: "Analytics" },
        { id: "users", icon: "◉", label: "Users" },
        { id: "announcements", icon: "◎", label: "Announcements" },
        { id: "logs", icon: "≡", label: "Logs" },
        { id: "rules", icon: "◧", label: "Rules" },
    ];

    return (
        <div style={{
            minHeight: "100vh",
            background: "#060609",
            fontFamily: "'Space Mono', monospace",
            display: "flex",
            position: "relative",
            overflow: "hidden"
        }}>
            <style>{GLOBAL_STYLES}</style>

            {/* Grid bg */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
                backgroundImage: `
                    linear-gradient(rgba(255,111,174,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,111,174,0.04) 1px, transparent 1px)
                `,
                backgroundSize: "48px 48px",
                animation: "gridPulse 6s ease-in-out infinite"
            }} />

            {/* Scanline */}
            <div style={{
                position: "fixed", top: 0, left: 0, right: 0, height: "2px",
                background: "linear-gradient(90deg, transparent, rgba(255,111,174,0.4), transparent)",
                zIndex: 10, pointerEvents: "none",
                animation: "scanline 8s linear infinite"
            }} />

            {/* Ambient blobs */}
            <div style={{
                position: "fixed", top: -200, right: -200,
                width: 500, height: 500, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,111,174,0.08) 0%, transparent 70%)",
                pointerEvents: "none", zIndex: 0
            }} />
            <div style={{
                position: "fixed", bottom: -200, left: 0,
                width: 400, height: 400, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(120,80,255,0.06) 0%, transparent 70%)",
                pointerEvents: "none", zIndex: 0
            }} />

            {/* ── DESKTOP SIDEBAR ── */}
            <motion.div
                className="admin-sidebar-desktop"
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: "fixed", left: 0, top: 0, bottom: 0,
                    width: "72px",
                    background: "rgba(8,8,14,0.95)",
                    borderRight: "1px solid rgba(255,111,174,0.12)",
                    backdropFilter: "blur(20px)",
                    flexDirection: "column",
                    alignItems: "center", padding: "1.5rem 0",
                    zIndex: 100, gap: "0.5rem"
                }}
            >
                {/* Logo mark */}
                <div style={{
                    width: "38px", height: "38px", borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(255,111,174,0.3), rgba(120,80,255,0.3))",
                    border: "1px solid rgba(255,111,174,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", marginBottom: "1.5rem",
                    boxShadow: "0 0 20px rgba(255,111,174,0.2)",
                    animation: "glow 3s ease-in-out infinite"
                }}>⬡</div>

                {NAV_ITEMS.map(item => (
                    <SidebarBtn
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={activePanel === item.id}
                        onClick={() => setActivePanel(item.id)}
                    />
                ))}

                <div style={{ flex: 1 }} />

                <SidebarBtn icon="⌂" label="Home" onClick={() => navigate("/")} />

                <div style={{
                    width: "30px", height: "1px",
                    background: "rgba(255,111,174,0.2)", margin: "0.25rem 0"
                }} />

                <SidebarBtn icon="⏻" label="Logout" onClick={() => setShowLogoutConfirm(true)} danger />
            </motion.div>

            {/* ── MOBILE BOTTOM NAV ── */}
            <div
                className="admin-bottomnav"
                style={{
                    position: "fixed", bottom: 0, left: 0, right: 0,
                    height: "60px",
                    background: "rgba(8,8,14,0.97)",
                    borderTop: "1px solid rgba(255,111,174,0.15)",
                    backdropFilter: "blur(20px)",
                    zIndex: 100,
                    alignItems: "center",
                    justifyContent: "space-around",
                    padding: "0 0.25rem",
                }}
            >
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActivePanel(item.id)}
                        style={{
                            flex: 1,
                            height: "100%",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "3px",
                            color: activePanel === item.id ? "#FF6FAE" : "rgba(255,255,255,0.3)",
                            transition: "color 0.2s",
                        }}
                    >
                        <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                        <span style={{
                            fontSize: "0.5rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontFamily: "'Space Mono', monospace",
                            opacity: activePanel === item.id ? 1 : 0.6,
                        }}>
                            {item.label}
                        </span>
                        {activePanel === item.id && (
                            <div style={{
                                position: "absolute",
                                bottom: 0,
                                width: "28px", height: "2px",
                                borderRadius: "2px",
                                background: "#FF6FAE",
                                boxShadow: "0 0 8px #FF6FAE",
                            }} />
                        )}
                    </button>
                ))}
                {/* Logout in bottom nav */}
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{
                        flex: 1,
                        height: "100%",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "3px",
                        color: "rgba(255,100,100,0.5)",
                        transition: "color 0.2s",
                    }}
                >
                    <span style={{ fontSize: "1rem" }}>⏻</span>
                    <span style={{ fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>
                        Out
                    </span>
                </button>
            </div>

            {/* ── LOGOUT MODAL ── */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 9999,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)"
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.88, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.88, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                            style={{
                                background: "rgba(8,8,14,0.98)",
                                border: "1px solid rgba(255,111,174,0.3)",
                                borderRadius: "20px",
                                padding: "2.5rem",
                                textAlign: "center",
                                maxWidth: "360px", width: "90%",
                                boxShadow: "0 0 0 1px rgba(255,111,174,0.05), 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255,111,174,0.1)",
                                fontFamily: "'Space Mono', monospace"
                            }}
                        >
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ fontSize: "2.5rem", marginBottom: "1rem" }}
                            >👋</motion.div>
                            <h2 style={{
                                color: "#fff", marginBottom: "0.5rem",
                                fontSize: "1.1rem", fontFamily: "'Syne', sans-serif",
                                fontWeight: 700, letterSpacing: "0.02em"
                            }}>
                                Sign out?
                            </h2>
                            <p style={{ color: "rgba(255,182,213,0.7)", fontSize: "0.78rem", marginBottom: "2rem", lineHeight: 1.6 }}>
                                You&apos;ll be redirected to the login page.
                            </p>
                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                                <ModalBtn onClick={handleLogout} variant="danger" label="Sign Out" />
                                <ModalBtn onClick={() => setShowLogoutConfirm(false)} variant="ghost" label="Cancel" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TOAST ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        style={{
                            position: "fixed", top: "1.25rem", left: "50%",
                            zIndex: 99999,
                            background: toast.type === "success"
                                ? "rgba(255,111,174,0.15)"
                                : toast.type === "error"
                                    ? "rgba(255,80,80,0.15)"
                                    : "rgba(80,120,255,0.15)",
                            border: `1px solid ${toast.type === "success" ? "rgba(255,111,174,0.5)"
                                : toast.type === "error" ? "rgba(255,80,80,0.5)"
                                    : "rgba(80,120,255,0.5)"
                                }`,
                            borderRadius: "12px",
                            padding: "0.75rem 1.5rem",
                            color: "#fff",
                            fontSize: "0.78rem",
                            letterSpacing: "0.02em",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            fontFamily: "'Space Mono', monospace",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MAIN CONTENT ── */}
            <div
                className="admin-main"
                style={{
                    flex: 1,
                    overflowY: "auto", minHeight: "100vh",
                    position: "relative", zIndex: 1
                }}
            >
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "2rem",
                        paddingBottom: "1.25rem",
                        borderBottom: "1px solid rgba(255,111,174,0.08)"
                    }}
                >
                    <div>
                        <div style={{
                            fontSize: "0.62rem", color: "rgba(255,111,174,0.6)",
                            letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "0.3rem"
                        }}>
                            ADMIN CORE / {activePanel.toUpperCase()}
                        </div>
                        <h1
                            className="admin-header-title"
                            style={{
                                color: "#fff", fontSize: "1.6rem",
                                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                                letterSpacing: "-0.02em", lineHeight: 1
                            }}
                        >
                            {panelTitle[activePanel]}
                        </h1>
                    </div>

                    <div
                        className="admin-header-badge"
                        style={{
                            display: "flex", alignItems: "center", gap: "0.6rem",
                            background: "rgba(255,111,174,0.06)",
                            border: "1px solid rgba(255,111,174,0.15)",
                            borderRadius: "50px", padding: "0.45rem 0.85rem"
                        }}
                    >
                        <div style={{
                            width: "8px", height: "8px", borderRadius: "50%",
                            background: "#FF6FAE",
                            boxShadow: "0 0 10px #FF6FAE",
                            animation: "glow 2s ease-in-out infinite",
                            flexShrink: 0,
                        }} />
                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.7rem", letterSpacing: "0.04em" }}>
                            {adminData?.name || "Admin"}
                        </span>
                    </div>
                </motion.div>

                {/* Panels */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activePanel}
                        initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {activePanel === "analytics" && (
    <AnalyticsPanel
        users={users}
        foreignerCount={users.filter(u => u.playerType === "foreigner" || u.isForeigner).length}
        localCount={users.filter(u => u.playerType !== "foreigner" && !u.isForeigner).length}
    />
)}

                        {activePanel === "users" && (
                            <UsersPanel
                                users={users}
                                adminName={adminData?.name}
                                onRefresh={loadData}
                                onPromote={promoteUser}
                                onDemote={demoteUser}
                                onDelete={deleteUser}
                            />
                        )}

                        {activePanel === "announcements" && (
                            <AnnouncementsPanel
                                announcements={announcements}
                                adminName={adminData?.name}
                                onRefresh={loadData}
                            />
                        )}

                        {activePanel === "logs" && (
                            <ActivityLog
                                logs={logs}
                                onRefresh={loadData}
                            />
                        )}

                        {activePanel === "rules" && (
                            <RulesPanel
                                adminName={adminData?.name}
                                onRefresh={loadData}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

function SidebarBtn({ icon, label, active, onClick, danger }) {
    const [hovered, setHovered] = useState(false);
    const show = hovered || active;

    return (
        <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    border: active
                        ? "1px solid rgba(255,111,174,0.5)"
                        : "1px solid transparent",
                    background: active
                        ? "rgba(255,111,174,0.12)"
                        : hovered
                            ? "rgba(255,255,255,0.04)"
                            : "transparent",
                    color: danger
                        ? (show ? "rgba(255,100,100,0.9)" : "rgba(255,100,100,0.4)")
                        : active
                            ? "#FF6FAE"
                            : show
                                ? "rgba(255,255,255,0.8)"
                                : "rgba(255,255,255,0.3)",
                    fontSize: "1.1rem", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease",
                    boxShadow: active ? "0 0 16px rgba(255,111,174,0.2)" : "none"
                }}
            >
                {icon}
            </motion.button>

            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute", left: "calc(100% + 12px)",
                            top: "50%", transform: "translateY(-50%)",
                            background: "rgba(8,8,14,0.96)",
                            border: "1px solid rgba(255,111,174,0.2)",
                            borderRadius: "8px", padding: "0.4rem 0.8rem",
                            color: "#fff", fontSize: "0.7rem",
                            letterSpacing: "0.05em", whiteSpace: "nowrap",
                            pointerEvents: "none", zIndex: 200,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                            fontFamily: "'Space Mono', monospace"
                        }}
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>

            {active && (
                <motion.div
                    layoutId="activeBar"
                    style={{
                        position: "absolute", right: 0, top: "50%",
                        transform: "translateY(-50%)",
                        width: "2px", height: "24px", borderRadius: "2px",
                        background: "linear-gradient(to bottom, transparent, #FF6FAE, transparent)"
                    }}
                />
            )}
        </div>
    );
}

function ModalBtn({ onClick, variant, label }) {
    return (
        <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            style={{
                padding: "0.65rem 1.5rem",
                borderRadius: "10px",
                border: variant === "danger"
                    ? "1px solid rgba(255,111,174,0.5)"
                    : "1px solid rgba(255,255,255,0.12)",
                background: variant === "danger"
                    ? "linear-gradient(135deg, rgba(255,111,174,0.25), rgba(255,111,174,0.1))"
                    : "rgba(255,255,255,0.05)",
                color: "#fff", cursor: "pointer",
                fontSize: "0.75rem", letterSpacing: "0.05em",
                fontFamily: "'Space Mono', monospace",
                transition: "all 0.2s ease"
            }}
        >
            {label}
        </motion.button>
    );
}

export default AdminDashboard;