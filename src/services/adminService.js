import {
    collection, getDocs, doc, updateDoc, deleteDoc,
    addDoc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../firebase";

export const getAllUsers = async () => {
    const snap = await getDocs(collection(db, "players"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const banUser = async (uid, reason, adminName) => {
    await updateDoc(doc(db, "players", uid), {
        status: "banned",
        banReason: reason,
        bannedAt: serverTimestamp(),
        bannedBy: adminName,
    });
    await logActivity(adminName, `Banned user ${uid} - Reason: ${reason}`);
};

export const unbanUser = async (uid, adminName) => {
    await updateDoc(doc(db, "players", uid), {
        status: "active",
        banReason: null,
        bannedAt: null,
        bannedBy: null,
    });
    await logActivity(adminName, `Unbanned user ${uid}`);
};

export const deleteUser = async (uid, adminName) => {
    await deleteDoc(doc(db, "players", uid));
    await logActivity(adminName, `Deleted user ${uid}`);
};

export const updateUserRole = async (uid, newRole, adminName) => {
    const isAdmin = newRole === "admin";

    await updateDoc(doc(db, "players", uid), {
        role: newRole,
        isAdmin: isAdmin,
    });

    await logActivity(adminName, `Changed role of ${uid} to ${newRole}`);
};

export const getAnnouncements = async () => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createAnnouncement = async (data, adminName) => {
    await addDoc(collection(db, "announcements"), {
        ...data,
        createdAt: serverTimestamp(),
        createdBy: adminName,
    });
    await logActivity(adminName, `Created announcement: "${data.title}"`);
};

export const deleteAnnouncement = async (id, adminName) => {
    await deleteDoc(doc(db, "announcements", id));
    await logActivity(adminName, `Deleted announcement ${id}`);
};

export const pinAnnouncement = async (id, pinned) => {
    await updateDoc(doc(db, "announcements", id), { pinned });
};

export const logActivity = async (adminName, action) => {
    await addDoc(collection(db, "adminLogs"), {
        admin: adminName,
        action,
        timestamp: serverTimestamp(),
    });
};

export const getActivityLogs = async () => {
    const q = query(collection(db, "adminLogs"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const exportUsersCSV = (users) => {
    const headers = ["Name", "Email", "Gender", "Grade", "Role", "Status", "Registered"];
    const rows = users.map(u => [
        u.name,
        u.email,
        u.gender,
        u.grade,
        u.role,
        u.status || "active",
        u.registeredAt || "N/A"
    ]);

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "udayan-smp-users.csv";
    a.click();

    URL.revokeObjectURL(url);
};
