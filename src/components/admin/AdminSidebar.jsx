import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const items = [
    { key: "analytics", label: "Analytics", icon: "📈" },
    { key: "users", label: "Users", icon: "👥" },
    { key: "announcements", label: "Announcements", icon: "📢" },
    { key: "logs", label: "Activity Logs", icon: "🧾" },
];

function AdminSidebar({ active, setActive, adminName, onLogout }) {
    const [open, setOpen] = useState(false);

    return (
        <motion.div
            onHoverStart={() => setOpen(true)}
            onHoverEnd={() => setOpen(false)}
            animate={{ width: open ? 220 : 64 }}
            transition={{ duration: 0.3 }}
            style={{
                height: "100vh", position: "fixed", left: 0, top: 0,
                background: "rgba(255,240,245,0.06)",
                backdropFilter: "blur(20px)",
                borderRight: "1px solid rgba(255,111,174,0.3)",
                boxShadow: "2px 0 30px rgba(255,111,174,0.1)",
                zIndex: 200, display: "flex", flexDirection: "column",
                overflow: "hidden", paddingTop: "20px",
                fontFamily: "'Courier New', monospace"
            }}
        >
            {/* Header */}
            <div style={{
                padding: "10px 14px 20px",
                borderBottom: "1px solid rgba(255,111,174,0.2)",
                marginBottom: "10px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem", minWidth: "36px", textAlign: "center" }}>🛡️</span>
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            >
                                <div style={{ color: "#FF6FAE", fontWeight: "bold", fontSize: "0.82rem", letterSpacing: "1px" }}>
                                    ADMIN PANEL
                                </div>
                                <div style={{
                                    color: "#ffb6d5", fontSize: "0.7rem",
                                    background: "rgba(255,111,174,0.15)",
                                    borderRadius: "4px", padding: "1px 6px",
                                    display: "inline-block", marginTop: "3px"
                                }}>
                                    {adminName}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav items */}
            {items.map(item => (
                <div
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "13px 14px", cursor: "pointer",
                        borderRadius: "8px", margin: "2px 6px",
                        background: active === item.key
                            ? "rgba(255,111,174,0.18)"
                            : "transparent",
                        borderLeft: active === item.key
                            ? "3px solid #FF6FAE"
                            : "3px solid transparent",
                        transition: "all 0.2s"
                    }}
                >
                    <span style={{ fontSize: "1.2rem", minWidth: "36px", textAlign: "center" }}>
                        {item.icon}
                    </span>
                    <AnimatePresence>
                        {open && (
                            <motion.span
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    color: active === item.key ? "#FF6FAE" : "#fff",
                                    fontSize: "0.85rem", whiteSpace: "nowrap"
                                }}
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            ))}

            {/* Logout */}
            <div
                onClick={onLogout}
                style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "13px 14px", cursor: "pointer",
                    borderRadius: "8px", margin: "auto 6px 20px 6px",
                    transition: "all 0.2s"
                }}
            >
                <img src="/Logout.png" style={{
                    width: "36px", height: "36px", minWidth: "36px",
                    objectFit: "contain", borderRadius: "6px"
                }} />
                <AnimatePresence>
                    {open && (
                        <motion.span
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ color: "#FF6FAE", fontSize: "0.85rem", whiteSpace: "nowrap", fontWeight: "bold" }}
                        >
                            Logout
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default AdminSidebar;