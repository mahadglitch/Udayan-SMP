import { motion } from "framer-motion";

const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .analytics-stats-grid {
      grid-template-columns: 1fr 1fr !important;
      gap: 0.75rem !important;
    }
    .analytics-stat-card {
      padding: 1.2rem 0.75rem !important;
    }
    .analytics-stat-value {
      font-size: 1.6rem !important;
    }
    .analytics-stat-icon {
      font-size: 1.6rem !important;
    }
    .analytics-grade-chip {
      min-width: 44px !important;
      padding: 0.45rem 0.5rem !important;
    }
    .analytics-gender-chip {
      flex: 1 !important;
      min-width: 0 !important;
    }
  }
`;

function StatCard({ icon, label, value, color }) {
    return (
        <motion.div
            className="analytics-stat-card"
            whileHover={{ scale: 1.04, y: -4 }}
            style={{
                background: "rgba(255,240,245,0.06)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${color}44`,
                borderRadius: "20px", padding: "2rem",
                textAlign: "center",
                boxShadow: `0 0 30px ${color}22`,
            }}
        >
            <div className="analytics-stat-icon" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{icon}</div>
            <div className="analytics-stat-value" style={{ color, fontSize: "2.2rem", fontWeight: "bold", fontFamily: "'Courier New', monospace" }}>
                {value}
            </div>
            <div style={{ color: "#aaa", fontSize: "0.82rem", marginTop: "0.3rem", fontFamily: "'Courier New', monospace" }}>
                {label}
            </div>
        </motion.div>
    );
}

function AnalyticsPanel({ users }) {
    const total = users.length;
    const active = users.filter(u => u.status !== "banned").length;
    const banned = users.filter(u => u.status === "banned").length;
    const admins = users.filter(u => u.role === "admin").length;

    const grades = Array.from({ length: 12 }, (_, i) => ({
        grade: i + 1,
        count: users.filter(u => u.grade === `Grade ${i + 1}` || String(u.grade) === String(i + 1)).length
    }));

    const genders = ["Male", "Female", "Other"].map(g => ({
        label: g,
        count: users.filter(u => u.gender === g).length
    }));

    return (
        <div>
            <style>{MOBILE_STYLES}</style>

            <h2 style={{
                color: "#FF6FAE", marginBottom: "2rem",
                fontSize: "1.5rem", letterSpacing: "2px",
                fontFamily: "'Courier New', monospace",
                textShadow: "0 0 20px rgba(255,111,174,0.5)"
            }}>
                Analytics Overview
            </h2>

            <div
                className="analytics-stats-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "3rem"
                }}
            >
                <StatCard icon="👥" label="Total Users" value={total} color="#FF6FAE" />
                <StatCard icon="✅" label="Active" value={active} color="#4ade80" />
                <StatCard icon="🚫" label="Banned" value={banned} color="#f87171" />
                <StatCard icon="⭐" label="Admins" value={admins} color="#a78bfa" />
            </div>

            {/* Grade distribution */}
            <div style={{
                background: "rgba(255,240,245,0.05)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,111,174,0.2)", borderRadius: "20px", padding: "1.5rem",
                marginBottom: "2rem"
            }}>
                <h3 style={{ color: "#ffb6d5", marginBottom: "1.2rem", fontFamily: "'Courier New', monospace", fontSize: "0.9rem" }}>
                    Grade Distribution
                </h3>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {grades.map(({ grade, count }) => (
                        <motion.div
                            key={grade}
                            className="analytics-grade-chip"
                            whileHover={{ scale: 1.08 }}
                            style={{
                                background: count > 0 ? "rgba(255,111,174,0.15)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${count > 0 ? "rgba(255,111,174,0.4)" : "rgba(255,255,255,0.1)"}`,
                                borderRadius: "10px", padding: "0.6rem 0.9rem",
                                textAlign: "center", minWidth: "54px",
                                fontFamily: "'Courier New', monospace"
                            }}
                        >
                            <div style={{ color: "#FF6FAE", fontWeight: "bold", fontSize: "1.1rem" }}>{count}</div>
                            <div style={{ color: "#888", fontSize: "0.7rem" }}>Gr.{grade}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Gender distribution */}
            <div style={{
                background: "rgba(255,240,245,0.05)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,111,174,0.2)", borderRadius: "20px", padding: "1.5rem"
            }}>
                <h3 style={{ color: "#ffb6d5", marginBottom: "1.2rem", fontFamily: "'Courier New', monospace", fontSize: "0.9rem" }}>
                    Gender Distribution
                </h3>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {genders.map(({ label, count }) => (
                        <div
                            key={label}
                            className="analytics-gender-chip"
                            style={{
                                background: "rgba(255,111,174,0.1)",
                                border: "1px solid rgba(255,111,174,0.3)",
                                borderRadius: "12px", padding: "0.8rem 1.5rem",
                                textAlign: "center", fontFamily: "'Courier New', monospace"
                            }}
                        >
                            <div style={{ color: "#FF6FAE", fontWeight: "bold", fontSize: "1.4rem" }}>{count}</div>
                            <div style={{ color: "#888", fontSize: "0.8rem" }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AnalyticsPanel;