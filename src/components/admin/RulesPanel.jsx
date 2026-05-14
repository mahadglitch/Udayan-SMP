import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DEFAULT_RULES = [
    { id: 1, icon: "🚫", title: "No Cheating / Hacking", text: "Cheating, hacking, x-ray, logging into other players' accounts without permission, duping, or using unfair mods is strictly prohibited. Anyone caught will be permanently banned.", severity: "critical" },
    { id: 2, icon: "🤝", title: "Respect Everyone", text: "Treat all players with respect. Insults, toxic behavior, or hate speech will not be tolerated.", severity: "high" },
    { id: 3, icon: "⚔️", title: "Fair PvP", text: "PvP is allowed, but no spawn killing or repeatedly targeting the same players.", severity: "medium" },
    { id: 4, icon: "🏗️", title: "No Griefing", text: "Do not destroy or steal other players' builds, bases, or items.", severity: "critical" },
    { id: 5, icon: "⚙️", title: "Keep the Server Clean", text: "Avoid laggy builds, random lava casts, or useless redstone creations that harm server performance.", severity: "medium" },
    { id: 6, icon: "💬", title: "No Spamming / Advertising", text: "Keep chat clean. Sharing links or advertising other servers is strictly forbidden.", severity: "medium" },
    { id: 7, icon: "👮", title: "Follow Staff Instructions", text: "Listen to Admins and the Owner. Report issues peacefully if needed.", severity: "high" },
    { id: 8, icon: "🔐", title: "Account Safety", text: "Keep your account secure. If a shared account breaks rules, the owner is responsible.", severity: "medium" },
    { id: 9, icon: "🎉", title: "Event Rules", text: "Follow all staff directions during server events. Unsportsmanlike conduct will result in disqualification.", severity: "medium" },
    { id: 10, icon: "😊", title: "Have Fun & Be Honest", text: "Udayan SMP is a community — enjoy the server, play fair, and respect others.", severity: "low" },
];

const SEVERITIES = ["critical", "high", "medium", "low"];

const severityConfig = {
    critical: { color: "#FF4466", glow: "rgba(255,68,102,0.35)", badge: "CRITICAL", bg: "rgba(255,68,102,0.08)" },
    high: { color: "#FF6FAE", glow: "rgba(255,111,174,0.3)", badge: "HIGH", bg: "rgba(255,111,174,0.08)" },
    medium: { color: "#ffb6d5", glow: "rgba(255,182,213,0.2)", badge: "MEDIUM", bg: "rgba(255,182,213,0.06)" },
    low: { color: "#aaffdd", glow: "rgba(170,255,221,0.15)", badge: "LOW", bg: "rgba(170,255,221,0.05)" },
};

const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .rules-panel {
      max-width: 100% !important;
    }
    /* Rule card row: allow wrapping so badge + actions don't get cut */
    .rule-header-row {
      flex-wrap: wrap !important;
      gap: 0.5rem !important;
    }
    .rule-title {
      /* Take full width so it doesn't get squished */
      min-width: 0 !important;
      flex: 1 1 100% !important;
      order: 2;
    }
    .rule-left-meta {
      order: 1;
      flex-shrink: 0;
    }
    .rule-severity-badge {
      order: 3;
      flex-shrink: 0;
    }
    .rule-actions {
      order: 4;
      width: 100% !important;
      justify-content: flex-end !important;
    }
    .rule-edit-grid {
      flex-direction: column !important;
    }
    .rule-edit-severity-col {
      flex: 1 1 100% !important;
    }
    .rules-filter-bar {
      flex-direction: column !important;
    }
    .rules-filter-bar input {
      width: 100% !important;
    }
    .rules-severity-pills {
      flex-wrap: wrap !important;
    }
  }
`;

const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,111,174,0.2)",
    borderRadius: "10px",
    color: "#fff",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.78rem",
    padding: "0.5rem 0.75rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
};

export default function RulesPanel({ adminName, onRefresh }) {
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState({});
    const [showAdd, setShowAdd] = useState(false);
    const [newRule, setNewRule] = useState({ icon: "📌", title: "", text: "", severity: "medium" });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [filterSeverity, setFilterSeverity] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                const snap = await getDoc(doc(db, "config", "rules"));
                if (snap.exists() && snap.data().list?.length > 0) setRules(snap.data().list);
            } catch (_) { }
        };
        fetch();
    }, []);

    const saveToFirestore = async (updatedRules) => {
        setSaving(true);
        try {
            await setDoc(doc(db, "config", "rules"), { list: updatedRules });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) {
            console.error(e);
        }
        setSaving(false);
    };

    const startEdit = (rule) => {
        setEditingId(rule.id);
        setDraft({ ...rule });
        setExpandedId(rule.id);
    };

    const saveEdit = () => {
        const updated = rules.map(r => r.id === editingId ? { ...draft } : r);
        setRules(updated);
        setEditingId(null);
        saveToFirestore(updated);
    };

    const cancelEdit = () => { setEditingId(null); setDraft({}); };

    const deleteRule = (id) => {
        const updated = rules.filter(r => r.id !== id);
        setRules(updated);
        setDeleteConfirm(null);
        saveToFirestore(updated);
    };

    const addRule = () => {
        if (!newRule.title.trim() || !newRule.text.trim()) return;
        const maxId = rules.reduce((m, r) => Math.max(m, r.id), 0);
        const updated = [...rules, { ...newRule, id: maxId + 1 }];
        setRules(updated);
        setShowAdd(false);
        setNewRule({ icon: "📌", title: "", text: "", severity: "medium" });
        saveToFirestore(updated);
    };

    const moveRule = (id, dir) => {
        const idx = rules.findIndex(r => r.id === id);
        if (idx < 0) return;
        const next = idx + dir;
        if (next < 0 || next >= rules.length) return;
        const copy = [...rules];
        [copy[idx], copy[next]] = [copy[next], copy[idx]];
        setRules(copy);
        saveToFirestore(copy);
    };

    const filtered = rules.filter(r => {
        const ms = filterSeverity === "all" || r.severity === filterSeverity;
        const mq = r.title.toLowerCase().includes(search.toLowerCase()) || r.text.toLowerCase().includes(search.toLowerCase());
        return ms && mq;
    });

    return (
        <div className="rules-panel" style={{ maxWidth: "820px" }}>
            <style>{MOBILE_STYLES}</style>

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                    <p style={{ color: "rgba(255,182,213,0.5)", fontSize: "0.72rem", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>
                        {rules.length} rules active • changes sync to /rules page
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowAdd(true)}
                    style={{
                        padding: "0.55rem 1.2rem",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,111,174,0.4)",
                        background: "rgba(255,111,174,0.12)",
                        color: "#FF6FAE",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        letterSpacing: "0.05em",
                        display: "flex", alignItems: "center", gap: "0.5rem"
                    }}
                >
                    <span style={{ fontSize: "1rem" }}>+</span> Add Rule
                </motion.button>
            </div>

            {/* Search + Filter */}
            <div
                className="rules-filter-bar"
                style={{
                    background: "rgba(255,111,174,0.05)",
                    border: "1px solid rgba(255,111,174,0.15)",
                    borderRadius: "16px",
                    padding: "1rem 1.2rem",
                    marginBottom: "1.2rem",
                    display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center"
                }}
            >
                <div style={{ flex: 1, minWidth: "160px", position: "relative" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", opacity: 0.5, fontSize: "0.8rem" }}>🔍</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search rules..."
                        style={{ ...inputStyle, paddingLeft: "2rem" }}
                    />
                </div>
                <div className="rules-severity-pills" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {["all", ...SEVERITIES].map(s => {
                        const cfg = s === "all" ? null : severityConfig[s];
                        const active = filterSeverity === s;
                        return (
                            <button
                                key={s}
                                onClick={() => setFilterSeverity(s)}
                                style={{
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "999px",
                                    border: active ? `1px solid ${cfg?.color || "#FF6FAE"}` : "1px solid rgba(255,255,255,0.1)",
                                    background: active ? `${cfg?.bg || "rgba(255,111,174,0.12)"}` : "transparent",
                                    color: active ? (cfg?.color || "#FF6FAE") : "rgba(255,255,255,0.35)",
                                    fontSize: "0.62rem", fontWeight: "bold",
                                    letterSpacing: "1px", textTransform: "uppercase",
                                    cursor: "pointer", fontFamily: "'Space Mono', monospace",
                                    transition: "all 0.15s", whiteSpace: "nowrap",
                                }}
                            >
                                {s === "all" ? "All" : severityConfig[s].badge}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Save status */}
            <AnimatePresence>
                {(saving || saved) && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            marginBottom: "0.8rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            background: saving ? "rgba(255,182,213,0.08)" : "rgba(170,255,221,0.08)",
                            border: `1px solid ${saving ? "rgba(255,182,213,0.3)" : "rgba(170,255,221,0.3)"}`,
                            color: saving ? "#ffb6d5" : "#aaffdd",
                            fontSize: "0.72rem", letterSpacing: "0.05em",
                            display: "flex", alignItems: "center", gap: "0.5rem"
                        }}
                    >
                        {saving ? "⏳ Saving to Firestore..." : "✓ Saved — rules page updated"}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rules List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                <AnimatePresence>
                    {filtered.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                            textAlign: "center", color: "rgba(255,182,213,0.4)",
                            padding: "3rem", fontSize: "0.82rem"
                        }}>
                            No rules match your filter 👀
                        </motion.div>
                    )}
                    {filtered.map((rule, i) => {
                        const sev = severityConfig[rule.severity] || severityConfig.medium;
                        const isOpen = expandedId === rule.id;
                        const isEditing = editingId === rule.id;

                        return (
                            <motion.div
                                key={rule.id}
                                layout
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ delay: i * 0.03 }}
                                style={{
                                    background: isOpen ? sev.bg : "rgba(255,255,255,0.025)",
                                    border: `1px solid ${isOpen ? sev.color : "rgba(255,111,174,0.14)"}`,
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                    boxShadow: isOpen ? `0 0 28px ${sev.glow}` : "none",
                                    transition: "box-shadow 0.2s, border-color 0.2s"
                                }}
                            >
                                {/* Left accent bar */}
                                <div style={{ display: "flex" }}>
                                    <div style={{
                                        width: "3px", flexShrink: 0,
                                        background: sev.color,
                                        boxShadow: `0 0 8px ${sev.color}`
                                    }} />

                                    <div style={{ flex: 1, padding: "0.9rem 0.9rem 0.9rem 1rem", minWidth: 0 }}>
                                        {/* Row header — wraps on mobile */}
                                        <div
                                            className="rule-header-row"
                                            style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}
                                        >
                                            {/* Number badge + icon — stays together */}
                                            <div
                                                className="rule-left-meta"
                                                style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}
                                            >
                                                <div style={{
                                                    minWidth: "30px", height: "30px", borderRadius: "8px",
                                                    background: "rgba(255,111,174,0.1)",
                                                    border: "1px solid rgba(255,111,174,0.25)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    color: "#FF6FAE", fontSize: "0.65rem", fontWeight: "900"
                                                }}>
                                                    {String(rule.id).padStart(2, "0")}
                                                </div>
                                                <span style={{ fontSize: "1.2rem" }}>{rule.icon}</span>
                                            </div>

                                            {/* Title — fills remaining space, truncates */}
                                            <div
                                                className="rule-title"
                                                style={{
                                                    flex: 1, color: "#fff", fontWeight: "bold",
                                                    fontSize: "0.88rem", minWidth: 0,
                                                    overflow: "hidden", textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {rule.title}
                                            </div>

                                            {/* Severity badge */}
                                            <div
                                                className="rule-severity-badge"
                                                style={{
                                                    padding: "2px 9px", borderRadius: "999px",
                                                    border: `1px solid ${sev.color}`,
                                                    background: sev.glow,
                                                    color: sev.color,
                                                    fontSize: "0.58rem", fontWeight: "900",
                                                    letterSpacing: "1.5px", whiteSpace: "nowrap",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {sev.badge}
                                            </div>

                                            {/* Actions */}
                                            <div
                                                className="rule-actions"
                                                style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexShrink: 0 }}
                                            >
                                                <IconBtn title="Move up" onClick={() => moveRule(rule.id, -1)}>↑</IconBtn>
                                                <IconBtn title="Move down" onClick={() => moveRule(rule.id, 1)}>↓</IconBtn>
                                                <IconBtn
                                                    title="Edit"
                                                    color="#FF6FAE"
                                                    onClick={() => isEditing ? cancelEdit() : startEdit(rule)}
                                                >
                                                    {isEditing ? "✕" : "✎"}
                                                </IconBtn>
                                                <IconBtn
                                                    title="Delete"
                                                    color="#FF4466"
                                                    onClick={() => setDeleteConfirm(rule.id)}
                                                >
                                                    🗑
                                                </IconBtn>
                                                <IconBtn
                                                    title={isOpen ? "Collapse" : "Expand"}
                                                    onClick={() => !isEditing && setExpandedId(isOpen ? null : rule.id)}
                                                >
                                                    <motion.span
                                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        style={{ display: "inline-block" }}
                                                    >▼</motion.span>
                                                </IconBtn>
                                            </div>
                                        </div>

                                        {/* Expanded / Edit area */}
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.18 }}
                                                    style={{ overflow: "hidden" }}
                                                >
                                                    {isEditing ? (
                                                        <div style={{
                                                            marginTop: "1rem",
                                                            paddingTop: "1rem",
                                                            borderTop: "1px solid rgba(255,111,174,0.12)",
                                                            display: "flex", flexDirection: "column", gap: "0.65rem"
                                                        }}>
                                                            <div
                                                                className="rule-edit-grid"
                                                                style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}
                                                            >
                                                                <div style={{ flex: "0 0 70px" }}>
                                                                    <label style={labelStyle}>Icon</label>
                                                                    <input
                                                                        value={draft.icon || ""}
                                                                        onChange={e => setDraft({ ...draft, icon: e.target.value })}
                                                                        style={{ ...inputStyle, textAlign: "center", fontSize: "1.2rem" }}
                                                                        maxLength={2}
                                                                    />
                                                                </div>
                                                                <div style={{ flex: 1, minWidth: "140px" }}>
                                                                    <label style={labelStyle}>Title</label>
                                                                    <input
                                                                        value={draft.title || ""}
                                                                        onChange={e => setDraft({ ...draft, title: e.target.value })}
                                                                        style={inputStyle}
                                                                    />
                                                                </div>
                                                                <div className="rule-edit-severity-col" style={{ flex: "0 0 130px" }}>
                                                                    <label style={labelStyle}>Severity</label>
                                                                    <select
                                                                        value={draft.severity}
                                                                        onChange={e => setDraft({ ...draft, severity: e.target.value })}
                                                                        style={{ ...inputStyle, cursor: "pointer" }}
                                                                    >
                                                                        {SEVERITIES.map(s => (
                                                                            <option key={s} value={s}>{severityConfig[s].badge}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={labelStyle}>Rule Text</label>
                                                                <textarea
                                                                    value={draft.text || ""}
                                                                    onChange={e => setDraft({ ...draft, text: e.target.value })}
                                                                    rows={3}
                                                                    style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.03 }}
                                                                    whileTap={{ scale: 0.97 }}
                                                                    onClick={saveEdit}
                                                                    style={{
                                                                        padding: "0.45rem 1.1rem",
                                                                        borderRadius: "8px",
                                                                        border: "1px solid rgba(170,255,221,0.4)",
                                                                        background: "rgba(170,255,221,0.1)",
                                                                        color: "#aaffdd",
                                                                        fontSize: "0.72rem",
                                                                        cursor: "pointer",
                                                                        fontFamily: "'Space Mono', monospace",
                                                                        letterSpacing: "0.05em"
                                                                    }}
                                                                >
                                                                    ✓ Save Changes
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.03 }}
                                                                    whileTap={{ scale: 0.97 }}
                                                                    onClick={cancelEdit}
                                                                    style={{
                                                                        padding: "0.45rem 1.1rem",
                                                                        borderRadius: "8px",
                                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                                        background: "transparent",
                                                                        color: "rgba(255,255,255,0.4)",
                                                                        fontSize: "0.72rem",
                                                                        cursor: "pointer",
                                                                        fontFamily: "'Space Mono', monospace",
                                                                        letterSpacing: "0.05em"
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            marginTop: "0.8rem",
                                                            paddingTop: "0.8rem",
                                                            borderTop: "1px solid rgba(255,111,174,0.1)",
                                                            color: "#ffb6d5",
                                                            fontSize: "0.82rem",
                                                            lineHeight: "1.7"
                                                        }}>
                                                            {rule.text}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Add Rule Modal */}
            <AnimatePresence>
                {showAdd && (
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
                        onClick={() => setShowAdd(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: "rgba(6,6,9,0.98)",
                                border: "1px solid rgba(255,111,174,0.3)",
                                borderRadius: "20px",
                                padding: "1.75rem",
                                width: "min(520px, 100%)",
                                boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,111,174,0.08)",
                                fontFamily: "'Space Mono', monospace",
                                maxHeight: "90vh", overflowY: "auto",
                            }}
                        >
                            <div style={{ color: "rgba(255,111,174,0.6)", fontSize: "0.62rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                                RULES / NEW
                            </div>
                            <h2 style={{ color: "#fff", fontSize: "1rem", marginBottom: "1.5rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                                Add New Rule
                            </h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                                    <div style={{ flex: "0 0 70px" }}>
                                        <label style={labelStyle}>Icon</label>
                                        <input
                                            value={newRule.icon}
                                            onChange={e => setNewRule({ ...newRule, icon: e.target.value })}
                                            style={{ ...inputStyle, textAlign: "center", fontSize: "1.2rem" }}
                                            maxLength={2}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: "160px" }}>
                                        <label style={labelStyle}>Title</label>
                                        <input
                                            value={newRule.title}
                                            onChange={e => setNewRule({ ...newRule, title: e.target.value })}
                                            placeholder="Rule title..."
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Rule Text</label>
                                    <textarea
                                        value={newRule.text}
                                        onChange={e => setNewRule({ ...newRule, text: e.target.value })}
                                        placeholder="Describe the rule in detail..."
                                        rows={3}
                                        style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Severity</label>
                                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                        {SEVERITIES.map(s => {
                                            const cfg = severityConfig[s];
                                            const active = newRule.severity === s;
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => setNewRule({ ...newRule, severity: s })}
                                                    style={{
                                                        padding: "0.4rem 1rem",
                                                        borderRadius: "999px",
                                                        border: `1px solid ${active ? cfg.color : "rgba(255,255,255,0.1)"}`,
                                                        background: active ? cfg.bg : "transparent",
                                                        color: active ? cfg.color : "rgba(255,255,255,0.3)",
                                                        fontSize: "0.65rem", fontWeight: "bold",
                                                        letterSpacing: "1px", textTransform: "uppercase",
                                                        cursor: "pointer", fontFamily: "'Space Mono', monospace",
                                                        transition: "all 0.15s"
                                                    }}
                                                >
                                                    {cfg.badge}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={addRule}
                                        disabled={!newRule.title.trim() || !newRule.text.trim()}
                                        style={{
                                            flex: 1, padding: "0.7rem",
                                            borderRadius: "10px",
                                            border: "1px solid rgba(255,111,174,0.5)",
                                            background: "linear-gradient(135deg, rgba(255,111,174,0.25), rgba(255,111,174,0.1))",
                                            color: "#fff", fontSize: "0.75rem",
                                            cursor: "pointer", fontFamily: "'Space Mono', monospace",
                                            letterSpacing: "0.05em",
                                            opacity: (!newRule.title.trim() || !newRule.text.trim()) ? 0.4 : 1
                                        }}
                                    >
                                        ✦ Add Rule
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowAdd(false)}
                                        style={{
                                            padding: "0.7rem 1.2rem",
                                            borderRadius: "10px",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            background: "transparent",
                                            color: "rgba(255,255,255,0.4)",
                                            fontSize: "0.75rem", cursor: "pointer",
                                            fontFamily: "'Space Mono', monospace"
                                        }}
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteConfirm !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 9999,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
                            padding: "1rem",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.88, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.88, opacity: 0 }}
                            style={{
                                background: "rgba(6,6,9,0.98)",
                                border: "1px solid rgba(255,68,102,0.35)",
                                borderRadius: "20px",
                                padding: "2rem",
                                textAlign: "center",
                                maxWidth: "340px", width: "100%",
                                boxShadow: "0 0 60px rgba(255,68,102,0.1), 0 40px 80px rgba(0,0,0,0.6)",
                                fontFamily: "'Space Mono', monospace"
                            }}
                        >
                            <div style={{ fontSize: "2rem", marginBottom: "0.8rem" }}>🗑️</div>
                            <h3 style={{ color: "#fff", fontSize: "0.95rem", marginBottom: "0.5rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                                Delete this rule?
                            </h3>
                            <p style={{ color: "rgba(255,182,213,0.6)", fontSize: "0.72rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                                "{rules.find(r => r.id === deleteConfirm)?.title}" will be permanently removed.
                            </p>
                            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center" }}>
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => deleteRule(deleteConfirm)}
                                    style={{
                                        padding: "0.6rem 1.3rem", borderRadius: "10px",
                                        border: "1px solid rgba(255,68,102,0.5)",
                                        background: "rgba(255,68,102,0.15)",
                                        color: "#FF4466", fontSize: "0.72rem",
                                        cursor: "pointer", fontFamily: "'Space Mono', monospace",
                                        letterSpacing: "0.05em"
                                    }}
                                >
                                    Delete
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setDeleteConfirm(null)}
                                    style={{
                                        padding: "0.6rem 1.3rem", borderRadius: "10px",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        background: "transparent",
                                        color: "rgba(255,255,255,0.5)", fontSize: "0.72rem",
                                        cursor: "pointer", fontFamily: "'Space Mono', monospace"
                                    }}
                                >
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function IconBtn({ children, onClick, color, title }) {
    return (
        <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title={title}
            onClick={e => { e.stopPropagation(); onClick(); }}
            style={{
                width: "28px", height: "28px",
                borderRadius: "7px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.04)",
                color: color || "rgba(255,255,255,0.4)",
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
                fontFamily: "'Space Mono', monospace",
                flexShrink: 0,
            }}
        >
            {children}
        </motion.button>
    );
}

const labelStyle = {
    display: "block",
    color: "rgba(255,182,213,0.5)",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "0.35rem"
};