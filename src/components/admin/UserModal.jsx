import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { banUser, unbanUser, deleteUser as deleteUserFromService } from "../../services/adminService";

function UserModal({ user, onClose, adminName, onRefresh, onPromote, onDemote, onDelete }) {
    const [banReason, setBanReason] = useState("");
    const [showBanInput, setShowBanInput] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!user) return null;
    const isBanned = user.status === "banned";

    const handleBan = async () => {
        if (!banReason.trim()) return alert("Enter a ban reason.");
        setLoading(true);
        await banUser(user.id, banReason, adminName);
        setLoading(false);
        onRefresh();
        onClose();
    };

    const handleUnban = async () => {
        setLoading(true);
        await unbanUser(user.id, adminName);
        setLoading(false);
        onRefresh();
        onClose();
    };

    const handleDelete = async () => {
        if (!window.confirm(`Permanently delete ${user.name}?`)) return;
        setLoading(true);

        if (onDelete) {
            await onDelete(user.id);
        } else {
            await deleteUserFromService(user.id, adminName);
        }

        setLoading(false);
        onRefresh();
        onClose();
    };

    const handleRoleToggle = async () => {
        const isAdmin = user.role === "admin" || user.isAdmin === true;
        const newRole = isAdmin ? "user" : "admin";

        if (!window.confirm(`Change ${user.name}'s role to ${newRole}?`)) return;

        setLoading(true);

        if (isAdmin) {
            await onDemote(user.id);
        } else {
            await onPromote(user.id);
        }

        setLoading(false);
        onRefresh();
        onClose();
    };

    const Field = ({ label, value }) => (
        <div style={{ marginBottom: "0.9rem" }}>
            <div style={{ color: "#888", fontSize: "0.72rem", marginBottom: "2px", fontFamily: "'Courier New', monospace" }}>
                {label}
            </div>
            <div style={{ color: "#fff", fontSize: "0.88rem", fontFamily: "'Courier New', monospace" }}>
                {value || "N/A"}
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}
            >
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: "rgba(10,10,15,0.97)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,111,174,0.4)",
                        borderRadius: "24px", padding: "2.5rem",
                        maxWidth: "500px", width: "90%",
                        boxShadow: "0 0 60px rgba(255,111,174,0.2)",
                        fontFamily: "'Courier New', monospace"
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.8rem" }}>
                        <h2 style={{ color: "#FF6FAE", margin: 0, fontSize: "1.2rem" }}>👤 User Profile</h2>
                        <button onClick={onClose} style={{
                            background: "none", border: "none", color: "#888",
                            fontSize: "1.5rem", cursor: "pointer", lineHeight: 1
                        }}>×</button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2rem" }}>
                        <Field label="NAME" value={user.name} />
                        <Field label="EMAIL" value={user.email} />
                        <Field label="GENDER" value={user.gender} />
                        <Field label="GRADE" value={user.grade} />
                        <Field label="SECTION" value={user.section} />
                        <Field label="MC USERNAME" value={user.mcUsername} />
                        <Field label="STUDENT ID" value={user.studentId} />
                        <Field label="ROLL" value={user.roll} />
                        <Field label="ROLE" value={
                            <span style={{
                                color: user.role === "admin" || user.isAdmin === true ? "#a78bfa" : "#4ade80",
                                background: user.role === "admin" || user.isAdmin === true ? "rgba(167,139,250,0.15)" : "rgba(74,222,128,0.15)",
                                padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem"
                            }}>
                                {user.role === "admin" || user.isAdmin === true ? "ADMIN" : "USER"}
                            </span>
                        } />
                        <Field label="STATUS" value={
                            <span style={{
                                color: isBanned ? "#f87171" : "#4ade80",
                                background: isBanned ? "rgba(248,113,113,0.15)" : "rgba(74,222,128,0.15)",
                                padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem"
                            }}>
                                {isBanned ? "BANNED" : "ACTIVE"}
                            </span>
                        } />
                        {isBanned && <Field label="BAN REASON" value={user.banReason} />}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginTop: "1.5rem" }}>
                        {isBanned ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleUnban} disabled={loading}
                                style={actionBtn("#4ade80")}
                            >
                                 Unban User
                            </motion.button>
                        ) : showBanInput ? (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                    value={banReason}
                                    onChange={e => setBanReason(e.target.value)}
                                    placeholder="Enter ban reason..."
                                    style={{
                                        flex: 1, background: "rgba(255,255,255,0.07)",
                                        border: "1px solid rgba(255,111,174,0.4)",
                                        borderRadius: "10px", padding: "0.6rem 1rem",
                                        color: "#fff", outline: "none", fontSize: "0.83rem",
                                        fontFamily: "'Courier New', monospace"
                                    }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }} onClick={handleBan}
                                    disabled={loading} style={actionBtn("#f87171")}
                                >
                                    Ban
                                </motion.button>
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => setShowBanInput(true)}
                                style={actionBtn("#f87171")}
                            >
                                 Ban User
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleRoleToggle} disabled={loading}
                            style={actionBtn("#a78bfa")}
                        >
                             {user.role === "admin" || user.isAdmin === true ? "Demote to User" : "Promote to Admin"}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleDelete} disabled={loading}
                            style={{ ...actionBtn("#ff4444"), background: "rgba(255,68,68,0.12)" }}
                        >
                             Delete User (Permanent)
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

const actionBtn = (color) => ({
    padding: "0.75rem 1rem", borderRadius: "12px", cursor: "pointer",
    border: `1px solid ${color}55`, background: `${color}15`,
    color, fontWeight: "bold", fontSize: "0.85rem",
    fontFamily: "'Courier New', monospace", transition: "all 0.2s"
});

export default UserModal;
