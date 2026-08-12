// src/store/userStore.js
import { create } from "zustand";
import { getDepartmentFromRole, getUserDepartment } from "../utils/department";
import axiosInstance from "../services/axiosInstance";
import { clearAuthSession, getAuthItem, removeAuthItem, setAuthItem } from "../utils/authStorage";

export const normalizeRole = (value = "") => {
    const text = value ? value.toString() : "";
    // Keep only lowercase alphanumeric characters so different spellings still match
    return text.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
};

const loadCurrentUser = () => {
    const token = getAuthItem("userToken");
    const storedRole = getAuthItem("userRole");
    const normalizedRole = normalizeRole(storedRole);
    const displayRole = getAuthItem("userRoleRaw") || storedRole || normalizedRole;
    const status = getAuthItem("userStatus");
    const infoStatus = getAuthItem("infoStatus");
    const trainingStatus = getAuthItem("trainingStatus");
    const username = getAuthItem("userName");
    const fullName = getAuthItem("userFullName");
    const jobTitle = getAuthItem("userJobTitle");
    const userId = getAuthItem("userId");
    const email = getAuthItem("userEmail");
    const departmentFromCache = getAuthItem("userDepartment") || getDepartmentFromRole(storedRole);

    return token
        ? {
              username,
              fullName,
              jobTitle,
              role: normalizedRole,
              normalizedRole,
              displayRole,
              status,
              infoStatus,
              trainingStatus,
              token,
              _id: userId,
              email,
              department: departmentFromCache || "",
          }
        : null;
};



export const useUserStore = create((set) => ({
    users: [],
    loading: false,
    error: null,
    currentUser: loadCurrentUser(), // Load current user from local storage

    setUsers: (users) => set({ users }),

    fetchUsers: async (silent = false) => {
        if (!silent) {
            set({ loading: true, error: null });
        }
        try {
            const { data } = await axiosInstance.get("/users");
            set({ users: data.data });
        } catch (error) {
            console.error("Failed to fetch users:", error);
            if (!silent) {
                set({ error: "Failed to load users. Please try again later." });
            }
        } finally {
            if (!silent) {
                set({ loading: false });
            }
        }
    },

    // Function to set the current user
    setCurrentUser: (user) => {
        if (user) {
            const normalizedRole = normalizeRole(user.role);
            const displayRole =
                user.role && user.role.toString().trim()
                    ? user.role.toString().trim()
                    : normalizedRole;
            const computedDepartment = getUserDepartment(user);
            const sanitizedUser = {
                ...user,
                role: normalizedRole,
                normalizedRole,
                displayRole,
                department: computedDepartment || "",
            };
            set({ currentUser: sanitizedUser });
            setAuthItem("userToken", user.token);
            setAuthItem("userRole", normalizedRole);
            setAuthItem("userRoleRaw", displayRole);
            setAuthItem("userName", user.username);
            setAuthItem("userFullName", user.fullName);
            setAuthItem("userJobTitle", user.jobTitle);
            setAuthItem("userStatus", user.status);
            setAuthItem("infoStatus", user.infoStatus);
            setAuthItem("trainingStatus", user.trainingStatus);
            setAuthItem("userId", user._id);
            if (user.email) {
                setAuthItem("userEmail", user.email);
            } else {
                removeAuthItem("userEmail");
            }
            setAuthItem("userDepartment", sanitizedUser.department || "");
        } else {
            set({ currentUser: null });
            clearAuthSession();
        }
    },

    // Function to clear the current user
    clearUser: () => {
        set({ currentUser: null }); // Clear user state
        clearAuthSession();
    },

    deleteUser: async (uid) => {
        try {
            const { data } = await axiosInstance.delete(`/users/${uid}`);
            if (!data.success) {
                return { success: false, message: data.message };
            }

            // Optimistically remove the user from the local state
            set((state) => ({
                users: state.users.filter(user => user._id !== uid),
            }));
            return { success: true, message: "User deleted successfully!" };
        } catch (error) {
            console.error("Error deleting user:", error);
            return { success: false, message: "Failed to delete user. Please try again later." };
        }
    },

    updateUser: async (uid, updatedUser) => {
        try {
            const { data } = await axiosInstance.put(`/users/${uid}`, updatedUser);
            if (!data.success) return { success: false, message: data.message };

            set((state) => ({
                users: state.users.map((user) => (user._id === uid ? data.data : user)),
            }));
            return { success: true, message: "User updated successfully!" };
        } catch (error) {
            console.error("Error updating user:", error);
            return { success: false, message: "Failed to update user. Please try again later." };
        }
    },

    updateUserInfo: async (updatedInfo) => {
        const uid = updatedInfo._id; // Get user ID from updatedInfo
        try {
            const { data } = await axiosInstance.put(`/users/info/${uid}`, updatedInfo);
            if (!data.success) return { success: false, message: data.message };
    
            // Update currentUser in the store
            set((state) => ({
                currentUser: { ...state.currentUser, ...updatedInfo },
                users: state.users.map((user) => (user._id === uid ? data.data : user)),
            }));
            return { success: true, message: "User information updated successfully!" };
        } catch (error) {
            console.error("Error updating user information:", error);
            return { success: false, message: "Failed to update user information. Please try again later." };
        }
    }



}));
