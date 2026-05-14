import { useState } from "react";
import { motion } from "framer-motion";
import UserModal from "./UserModal";
import { exportUsersCSV } from "../../services/adminService";

const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .users-header-row {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .users-filters {
      flex-direction: column !important;
    }
    .users-filters input,
    .users-filters select {
      width: 100% !important;
      min-width: 0 !important;
    }
    .users-table-wrap table {
      min-width: 520px !important;
    }
  }
`;

function UsersPanel({ users, adminName, onRefresh, onPromote, onDemote, onDelete }) {
    const [search, setSearch] = useState("");
    const [filterGender, setFilterGender] = useState("all");
    const [filterGrade, setFilterGrade] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        const matchGender = filterGender === "all" || u.gender === filterGender;
        const matchGrade = filterGrade === "all" ||
            u.grade === filterGrade ||
            u.grade === `Grade ${filterGrade}`;
        const matchStatus = filterStatus === "all" ||
            (filterStatus === "banned" ? u.status === "banned" : u.status !== "banned");
        return matchSearch && matchGender && matchGrade && matchStatus;
    });

    const selectStyle = {
        background: "rgba(255,240,245,0.07)",
        border: "1px solid rgba(255,111,174,0.3)",
        borderRadius: "10px", padding: "0.55rem 1rem",
        color: "#fff", outline: "none", fontSize: "0.83rem",
        fontFamily: "'Courier New', monospace", cursor: "pointer"
    };

    return (
        <div>
            <style>{MOBILE_STYLES}</style>

            <div
                className="users-header-row"
                style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "1.8rem",
                    flexWrap: "wrap", gap: "1rem"
                }}
            >
                <h2 style={{
                    color: "#FF6FAE", fontSize: "1.5rem",
                    letterSpacing: "2px", margin: 0,
                    fontFamily: "'Courier New', monospace",
                    textShadow: "0 0 20px rgba(255,111,174,0.5)"
                }}>
                    Users Database
                </h2>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => exportUsersCSV(users)}
                    style={{
                        padding: "0.6rem 1.3rem", borderRadius: "10px",
                        background: "rgba(74,222,128,0.12)",
                        border: "1px solid rgba(74,222,128,0.4)",
                        color: "#4ade80", cursor: "pointer", fontWeight: "bold",
                        fontFamily: "'Courier New', monospace"
                    }}
                >
                    Export CSV
                </motion.button>
            </div>

            {/* Filters */}
            <div className="users-filters" style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <input
                    style={{
                        ...selectStyle, flex: "1", minWidth: "200px",
                        cursor: "text"
                    }}
                    placeholder="🔎 Search name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select style={selectStyle} value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                    <option value="all">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
                <select style={selectStyle} value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                    <option value="all">All Grades</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(g =>
                        <option key={g} value={g}>Grade {g}</option>
                    )}
                </select>
                <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            {/* Stats bar */}
            <div style={{ color: "#888", fontSize: "0.78rem", marginBottom: "1rem", fontFamily: "'Courier New', monospace" }}>
                Showing <span style={{ color: "#FF6FAE", fontWeight: "bold" }}>{filtered.length}</span> of {users.length} users
            </div>

            {/* Table */}
            <div
                className="users-table-wrap"
                style={{
                    overflowX: "auto", borderRadius: "16px",
                    border: "1px solid rgba(255,111,174,0.2)",
                    backdropFilter: "blur(12px)",
                    background: "rgba(255,240,245,0.03)",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Courier New', monospace", minWidth: "700px" }}>
                    <thead>
                        <tr style={{ background: "rgba(255,111,174,0.1)", borderBottom: "1px solid rgba(255,111,174,0.3)" }}>
                            {["Name", "Email", "Gender", "Grade", "Role", "Status", "Registered"].map(h => (
                                <th key={h} style={{
                                    padding: "1rem",
                                    color: "#FF6FAE", textAlign: "left",
                                    fontSize: "0.75rem", fontWeight: "bold",
                                    letterSpacing: "1px", whiteSpace: "nowrap",
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#555", fontFamily: "'Courier New', monospace" }}>
                                    No users found
                                </td>
                            </tr>
                        ) : filtered.map((u, i) => (
                            <motion.tr
                                key={u.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.025 }}
                                onClick={() => setSelectedUser(u)}
                                whileHover={{ background: "rgba(255,111,174,0.08)" }}
                                style={{
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                    background: u.status === "banned" ? "rgba(248,113,113,0.04)" : "transparent",
                                }}
                            >
                                <td style={{ padding: "0.85rem 1rem", color: "#fff", fontSize: "0.85rem", whiteSpace: "nowrap" }}>{u.name}</td>
                                <td style={{ padding: "0.85rem 1rem", color: "#aaa", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{u.email}</td>
                                <td style={{ padding: "0.85rem 1rem", color: "#ddd", fontSize: "0.83rem" }}>{u.gender}</td>
                                <td style={{ padding: "0.85rem 1rem", color: "#ddd", fontSize: "0.83rem" }}>{u.grade}</td>
                                <td style={{ padding: "0.85rem 1rem" }}>
                                    <span style={{
                                        color: u.role === "admin" ? "#a78bfa" : "#4ade80",
                                        background: u.role === "admin" ? "rgba(167,139,250,0.15)" : "rgba(74,222,128,0.15)",
                                        padding: "2px 8px", borderRadius: "6px",
                                        fontSize: "0.72rem", fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {u.role?.toUpperCase() || "USER"}
                                    </span>
                                </td>
                                <td style={{ padding: "0.85rem 1rem" }}>
                                    <span style={{
                                        color: u.status === "banned" ? "#f87171" : "#4ade80",
                                        background: u.status === "banned" ? "rgba(248,113,113,0.15)" : "rgba(74,222,128,0.15)",
                                        padding: "2px 8px", borderRadius: "6px",
                                        fontSize: "0.72rem", fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {u.status === "banned" ? "BANNED" : "ACTIVE"}
                                    </span>
                                </td>
                                <td style={{ padding: "0.85rem 1rem", color: "#888", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                                    {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : "N/A"}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <UserModal
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                adminName={adminName}
                onRefresh={onRefresh}
                onPromote={onPromote}
                onDemote={onDemote}
                onDelete={onDelete}
            />
        </div>
    );
}

export default UsersPanel;