import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase";
import { collection, deleteDoc, doc, writeBatch, getDocs } from "firebase/firestore";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');`;

const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .log-toolbar {
      flex-wrap: wrap !important;
    }
    .log-toolbar input {
      width: 100% !important;
      min-width: 0 !important;
    }
    .log-row {
      flex-wrap: wrap !important;
      gap: 0.4rem !important;
    }
    .log-action-label {
      min-width: 0 !important;
      width: 100% !important;
    }
    .log-actor {
      flex: 1 1 100% !important;
      white-space: normal !important;
    }
    .log-time {
      flex-shrink: 0;
    }
  }
`;

function PinkBtn({ onClick, children, variant = "primary", small = false, disabled = false }) {
    return (
        <motion.button
            whileHover={disabled ? {} : { scale: 1.03 }}
            whileTap={disabled ? {} : { scale: 0.97 }}
            onClick={disabled ? undefined : onClick}
            style={{
                padding: small ? "0.4rem 0.8rem" : "0.6rem 1.2rem",
                borderRadius: "8px",
                border: variant === "danger"
                    ? "1px solid rgba(255,80,80,0.45)"
                    : variant === "ghost"
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "1px solid rgba(255,111,174,0.4)",
                background: variant === "danger"
                    ? "rgba(255,80,80,0.1)"
                    : variant === "ghost"
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(255,111,174,0.15)",
                color: variant === "danger" ? "rgba(255,110,110,0.85)" : "#fff",
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: small ? "0.65rem" : "0.7rem",
                letterSpacing: "0.06em",
                fontFamily: "'Space Mono', monospace",
                opacity: disabled ? 0.45 : 1,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </motion.button>
    );
}

export default function ActivityLog({ logs, onRefresh }) {
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filtered = logs.filter(l =>
        !search ||
        JSON.stringify(l).toLowerCase().includes(search.toLowerCase())
    );

    const handleDeleteLog = async (id) => {
        setDeleting(true);
        try {
            await deleteDoc(doc(db, "adminLogs", id));
            onRefresh?.();
            showToast("Log entry deleted");
        } catch (e) {
            console.error(e);
            showToast("Failed to delete log", "error");
        }
        setDeleting(false);
        setDeleteTarget(null);
    };

    const handleDeleteAll = async () => {
        setDeleting(true);
        try {
            const snap = await getDocs(collection(db, "adminLogs"));
            if (snap.empty) {
                showToast("No logs to delete");
                setDeleting(false);
                setDeleteTarget(null);
                return;
            }
            const batchSize = 500;
            const docs = snap.docs;
            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = writeBatch(db);
                docs.slice(i, i + batchSize).forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
            onRefresh?.();
            showToast(`Cleared ${docs.length} log${docs.length !== 1 ? "s" : ""} ✦`);
        } catch (e) {
            console.error(e);
            showToast("Failed to clear logs", "error");
        }
        setDeleting(false);
        setDeleteTarget(null);
    };

    const formatTime = (ts) => {
        if (!ts) return "—";
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleString(undefined, {
            month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    const actionColor = (action = "") => {
        const a = action.toLowerCase();
        if (a.includes("delete") || a.includes("ban") || a.includes("remove")) return "#ff6060";
        if (a.includes("promote") || a.includes("admin")) return "#FF6FAE";
        if (a.includes("login") || a.includes("sign")) return "#60cfff";
        if (a.includes("create") || a.includes("post") || a.includes("add")) return "#60ff9a";
        return "rgba(255,255,255,0.5)";
    };

    return (
        <div style={{ fontFamily: "'Space Mono', monospace" }}>
            <style>{FONTS}</style>
            <style>{MOBILE_STYLES}</style>

            {/* Toolbar */}
            <div
                className="log-toolbar"
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}
            >
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter logs…"
                    style={{
                        flex: 1, minWidth: "200px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,111,174,0.2)",
                        borderRadius: "10px",
                        padding: "0.6rem 1rem",
                        color: "#fff", fontSize: "0.75rem",
                        fontFamily: "'Space Mono', monospace",
                        outline: "none",
                    }}
                />
                <span style={{ color: "rgba(255,111,174,0.5)", fontSize: "0.65rem", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                    {filtered.length} / {logs.length} ENTRIES
                </span>
                <PinkBtn
                    variant="danger"
                    onClick={() => setDeleteTarget("all")}
                    disabled={logs.length === 0}
                >
                    ✕ Clear All
                </PinkBtn>
            </div>

            {/* Log list */}
            {filtered.length === 0 ? (
                <div style={{
                    background: "rgba(255,111,174,0.04)",
                    border: "1px solid rgba(255,111,174,0.1)",
                    borderRadius: "14px", padding: "3rem",
                    textAlign: "center", color: "rgba(255,182,213,0.4)",
                    fontSize: "0.75rem"
                }}>
                    {search ? "No logs match your filter." : "No activity logs yet."}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {filtered.map((log, i) => (
                        <motion.div
                            key={log.id}
                            className="log-row"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ delay: i * 0.02 }}
                            style={{
                                display: "flex", alignItems: "center", gap: "0.75rem",
                                background: "rgba(255,111,174,0.03)",
                                border: "1px solid rgba(255,111,174,0.08)",
                                borderRadius: "10px",
                                padding: "0.65rem 0.85rem",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,111,174,0.07)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,111,174,0.03)"}
                        >
                            {/* Action dot */}
                            <div style={{
                                width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                                background: actionColor(log.action),
                                boxShadow: `0 0 6px ${actionColor(log.action)}`,
                            }} />

                            {/* Action label */}
                            <div
                                className="log-action-label"
                                style={{
                                    minWidth: "120px", color: actionColor(log.action),
                                    fontSize: "0.68rem", letterSpacing: "0.05em", flexShrink: 0,
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                }}
                            >
                                {log.action || "EVENT"}
                            </div>

                            {/* Actor */}
                            <div
                                className="log-actor"
                                style={{
                                    flex: 1, color: "rgba(255,255,255,0.65)", fontSize: "0.7rem",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    minWidth: 0,
                                }}
                            >
                                {log.user || log.adminName || log.by || "System"}
                                {log.target && (
                                    <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "0.5rem" }}>→ {log.target}</span>
                                )}
                                {log.details && (
                                    <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: "0.5rem" }}>· {log.details}</span>
                                )}
                            </div>

                            {/* Timestamp */}
                            <div
                                className="log-time"
                                style={{ color: "rgba(255,111,174,0.4)", fontSize: "0.6rem", flexShrink: 0, letterSpacing: "0.03em" }}
                            >
                                {formatTime(log.timestamp || log.createdAt)}
                            </div>

                            {/* Delete */}
                            <PinkBtn small variant="danger" onClick={() => setDeleteTarget(log.id)}>
                                ✕
                            </PinkBtn>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 9999,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
                            padding: "1rem",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.88, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.88, y: 20 }}
                            style={{
                                background: "rgba(8,8,14,0.98)",
                                border: "1px solid rgba(255,80,80,0.3)",
                                borderRadius: "20px", padding: "2.5rem",
                                textAlign: "center", maxWidth: "360px", width: "100%",
                                boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
                                fontFamily: "'Space Mono', monospace"
                            }}
                        >
                            <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>
                                {deleteTarget === "all" ? "🗑" : "✕"}
                            </div>
                            <h2 style={{ color: "#fff", fontSize: "1rem", fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: "0.5rem" }}>
                                {deleteTarget === "all" ? "Clear All Logs?" : "Delete Log Entry?"}
                            </h2>
                            <p style={{ color: "rgba(255,182,213,0.6)", fontSize: "0.72rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                                {deleteTarget === "all"
                                    ? `This will permanently delete all ${logs.length} log entries from Firebase.`
                                    : "This will permanently remove this log entry from Firebase."}
                            </p>
                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                                <PinkBtn
                                    variant="danger"
                                    disabled={deleting}
                                    onClick={() =>
                                        deleteTarget === "all"
                                            ? handleDeleteAll()
                                            : handleDeleteLog(deleteTarget)
                                    }
                                >
                                    {deleting ? "Deleting…" : deleteTarget === "all" ? "Clear All" : "Delete"}
                                </PinkBtn>
                                <PinkBtn variant="ghost" onClick={() => setDeleteTarget(null)}>
                                    Cancel
                                </PinkBtn>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -16, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -16, x: "-50%" }}
                        style={{
                            position: "fixed", top: "1.25rem", left: "50%",
                            zIndex: 99999,
                            background: toast.type === "error" ? "rgba(255,80,80,0.15)" : "rgba(255,111,174,0.15)",
                            border: `1px solid ${toast.type === "error" ? "rgba(255,80,80,0.5)" : "rgba(255,111,174,0.5)"}`,
                            borderRadius: "12px", padding: "0.75rem 1.5rem",
                            color: "#fff", fontSize: "0.78rem",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            fontFamily: "'Space Mono', monospace",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}