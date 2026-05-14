import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase";
import {
    collection, addDoc, deleteDoc, doc,
    updateDoc, serverTimestamp,
} from "firebase/firestore";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');`;

const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .ann-form-grid { grid-template-columns: 1fr !important; }
    .ann-card-inner { flex-direction: column !important; align-items: flex-start !important; }
    .ann-card-actions { width: 100% !important; justify-content: flex-end !important; }
  }
`;

const cardStyle = {
    background: "rgba(255,111,174,0.04)",
    border: "1px solid rgba(255,111,174,0.12)",
    borderRadius: "16px",
    padding: "1.25rem 1.5rem",
    fontFamily: "'Space Mono', monospace",
};

const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,111,174,0.2)",
    borderRadius: "10px",
    padding: "0.65rem 1rem",
    color: "#fff",
    fontSize: "0.78rem",
    fontFamily: "'Space Mono', monospace",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
};

const labelStyle = {
    color: "rgba(255,111,174,0.7)",
    fontSize: "0.62rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    marginBottom: "0.4rem",
    display: "block",
    fontFamily: "'Space Mono', monospace",
};

function PinkBtn({ onClick, children, variant = "primary", small = false, disabled = false }) {
    return (
        <motion.button
            whileHover={disabled ? {} : { scale: 1.03 }}
            whileTap={disabled ? {} : { scale: 0.97 }}
            onClick={disabled ? undefined : onClick}
            style={{
                padding: small ? "0.45rem 0.9rem" : "0.65rem 1.4rem",
                borderRadius: "10px",
                border: variant === "danger"
                    ? "1px solid rgba(255,80,80,0.5)"
                    : variant === "ghost"
                        ? "1px solid rgba(255,255,255,0.12)"
                        : "1px solid rgba(255,111,174,0.5)",
                background: variant === "danger"
                    ? "rgba(255,80,80,0.12)"
                    : variant === "ghost"
                        ? "rgba(255,255,255,0.05)"
                        : "linear-gradient(135deg, rgba(255,111,174,0.25), rgba(255,111,174,0.1))",
                color: variant === "danger" ? "rgba(255,110,110,0.9)" : "#fff",
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: small ? "0.68rem" : "0.72rem",
                letterSpacing: "0.05em",
                fontFamily: "'Space Mono', monospace",
                opacity: disabled ? 0.5 : 1,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </motion.button>
    );
}

export default function AnnouncementsPanel({ announcements, adminName, onRefresh }) {
    const [annForm, setAnnForm] = useState({ title: "", description: "", pinned: false });
    const [annSaving, setAnnSaving] = useState(false);
    const [showAnnForm, setShowAnnForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddAnnouncement = async () => {
        if (!annForm.title.trim()) return;
        setAnnSaving(true);
        try {
            await addDoc(collection(db, "announcements"), {
                ...annForm,
                createdBy: adminName || "Admin",
                createdAt: serverTimestamp(),
            });
            setAnnForm({ title: "", description: "", pinned: false });
            setShowAnnForm(false);
            onRefresh();
            showToast("Announcement posted ✦");
        } catch (e) {
            console.error(e);
            showToast("Failed to post", "error");
        }
        setAnnSaving(false);
    };

    const handleDeleteAnnouncement = async (id) => {
        try {
            await deleteDoc(doc(db, "announcements", id));
            onRefresh();
            showToast("Announcement removed");
        } catch (e) {
            showToast("Failed to delete", "error");
        }
        setDeleteTarget(null);
    };

    const handleTogglePin = async (id, current) => {
        try {
            await updateDoc(doc(db, "announcements", id), { pinned: !current });
            onRefresh();
            showToast(!current ? "Pinned ✦" : "Unpinned");
        } catch (e) {
            showToast("Failed to update", "error");
        }
    };

    return (
        <div style={{ fontFamily: "'Space Mono', monospace" }}>
            <style>{FONTS}</style>
            <style>{MOBILE_STYLES}</style>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
                <PinkBtn onClick={() => setShowAnnForm(v => !v)}>
                    {showAnnForm ? "✕ Cancel" : "+ New Announcement"}
                </PinkBtn>
            </div>

            <AnimatePresence>
                {showAnnForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden", marginBottom: "1.5rem" }}
                    >
                        <div style={{ ...cardStyle, borderColor: "rgba(255,111,174,0.3)" }}>
                            <div style={{ color: "#FF6FAE", fontSize: "0.7rem", letterSpacing: "0.2em", marginBottom: "1.25rem" }}>
                                NEW ANNOUNCEMENT
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={labelStyle}>Title *</label>
                                <input
                                    style={inputStyle}
                                    placeholder="Announcement title…"
                                    value={annForm.title}
                                    onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))}
                                />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={labelStyle}>Description</label>
                                <textarea
                                    style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                                    placeholder="Optional description…"
                                    value={annForm.description}
                                    onChange={e => setAnnForm(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "0.72rem", fontFamily: "'Space Mono', monospace" }}>
                                    <input
                                        type="checkbox"
                                        checked={annForm.pinned}
                                        onChange={e => setAnnForm(p => ({ ...p, pinned: e.target.checked }))}
                                        style={{ accentColor: "#FF6FAE" }}
                                    />
                                    Pin this announcement
                                </label>
                                <div style={{ flex: 1 }} />
                                <PinkBtn onClick={handleAddAnnouncement} disabled={annSaving}>
                                    {annSaving ? "Posting…" : "Post ✦"}
                                </PinkBtn>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {announcements.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: "center", color: "rgba(255,182,213,0.5)", padding: "3rem" }}>
                    No announcements yet.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {announcements.map((a, i) => (
                        <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            style={{
                                ...cardStyle,
                                borderColor: a.pinned ? "rgba(255,111,174,0.35)" : "rgba(255,111,174,0.12)",
                                background: a.pinned ? "rgba(255,111,174,0.07)" : "rgba(255,111,174,0.03)",
                            }}
                        >
                            <div className="ann-card-inner" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.3rem", fontFamily: "'Syne', sans-serif" }}>
                                        {a.pinned && <span style={{ color: "#FF6FAE", marginRight: "8px" }}>📌</span>}
                                        {a.title}
                                    </div>
                                    {a.description && (
                                        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", lineHeight: 1.6 }}>
                                            {a.description}
                                        </div>
                                    )}
                                    <div style={{ color: "rgba(255,111,174,0.4)", fontSize: "0.62rem", marginTop: "0.4rem" }}>
                                        {a.createdAt?.toDate?.()?.toLocaleDateString() || ""} · {a.createdBy || "Admin"}
                                    </div>
                                </div>
                                <div className="ann-card-actions" style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                                    <PinkBtn small variant="ghost" onClick={() => handleTogglePin(a.id, a.pinned)}>
                                        {a.pinned ? "Unpin" : "Pin"}
                                    </PinkBtn>
                                    <PinkBtn small variant="danger" onClick={() => setDeleteTarget({ id: a.id })}>
                                        Delete
                                    </PinkBtn>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", padding: "1rem" }}
                    >
                        <motion.div
                            initial={{ scale: 0.88, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 20 }}
                            style={{ background: "rgba(8,8,14,0.98)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "20px", padding: "2.5rem", textAlign: "center", maxWidth: "340px", width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", fontFamily: "'Space Mono', monospace" }}
                        >
                            <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>🗑</div>
                            <h2 style={{ color: "#fff", fontSize: "1rem", fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: "0.5rem" }}>
                                Delete Announcement?
                            </h2>
                            <p style={{ color: "rgba(255,182,213,0.6)", fontSize: "0.72rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                                This will permanently remove it from Firebase.
                            </p>
                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                                <PinkBtn variant="danger" onClick={() => handleDeleteAnnouncement(deleteTarget.id)}>Delete</PinkBtn>
                                <PinkBtn variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</PinkBtn>
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
                        style={{ position: "fixed", top: "1.25rem", left: "50%", zIndex: 99999, background: toast.type === "error" ? "rgba(255,80,80,0.15)" : "rgba(255,111,174,0.15)", border: `1px solid ${toast.type === "error" ? "rgba(255,80,80,0.5)" : "rgba(255,111,174,0.5)"}`, borderRadius: "12px", padding: "0.75rem 1.5rem", color: "#fff", fontSize: "0.78rem", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}