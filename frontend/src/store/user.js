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
    const examStatus = getAuthItem("examStatus");
    const examBypass = getAuthItem("examBypass") === "true";
    const username = getAuthItem("userName");
    const fullName = getAuthItem("userFullName");
    const jobTitle = getAuthItem("userJobTitle");
    const userId = getAuthItem("userId");
    const email = getAuthItem("userEmail");
    const photo = getAuthItem("userPhoto");
    const photoUrl = getAuthItem("userPhotoUrl");
    const phone = getAuthItem("userPhone");
    const location = getAuthItem("userLocation");
    const bio = getAuthItem("userBio");
    const website = getAuthItem("userWebsite");
    const linkedin = getAuthItem("userLinkedin");
    const twitter = getAuthItem("userTwitter");
    const facebook = getAuthItem("userFacebook");
    const telegram = getAuthItem("userTelegram");
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
              examStatus,
              examBypass,
              token,
              _id: userId,
              email,
              photo,
              photoUrl,
              phone,
              location,
              bio,
              website,
              linkedin,
              twitter,
              facebook,
              telegram,
              department: departmentFromCache || "",
          }
        : null;
};



export const useUserStore = create((set, get) => ({
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

    // Refresh current user data from server
    refreshCurrentUser: async () => {
        const current = get().currentUser;
        if (!current?._id) return null;
        try {
            const { data } = await axiosInstance.get(`/users/me`);
            if (data?.success && data?.data) {
                const refreshed = {
                    ...current,
                    ...data.data,
                    photoUrl: data.data.photoUrl || current.photoUrl,
                };
                get().setCurrentUser(refreshed);
                return refreshed;
            }
        } catch (err) {
            console.warn("Could not refresh current user:", err.message);
        }
        return current;
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
                department: computedDepartment || user.department || "",
            };
            set({ currentUser: sanitizedUser });
            setAuthItem("userToken", user.token || getAuthItem("userToken"));
            setAuthItem("userRole", normalizedRole);
            setAuthItem("userRoleRaw", displayRole);
            setAuthItem("userName", user.username);
            setAuthItem("userFullName", user.fullName || "");
            setAuthItem("userJobTitle", user.jobTitle || "");
            setAuthItem("userStatus", user.status || "active");
            setAuthItem("infoStatus", user.infoStatus || "pending");
            setAuthItem("trainingStatus", user.trainingStatus || "");
            setAuthItem("examStatus", user.examStatus || "");
            setAuthItem("examBypass", user.examBypass ? "true" : "false");
            setAuthItem("userId", user._id);
            if (user.email) {
                setAuthItem("userEmail", user.email);
            } else {
                removeAuthItem("userEmail");
            }
            setAuthItem("userDepartment", sanitizedUser.department || "");
            setAuthItem("userPhoto", user.photo || "");
            setAuthItem("userPhotoUrl", user.photoUrl || "");
            setAuthItem("userPhone", user.phone || "");
            setAuthItem("userLocation", user.location || "");
            setAuthItem("userBio", user.bio || "");
            setAuthItem("userWebsite", user.website || "");
            setAuthItem("userLinkedin", user.linkedin || "");
            setAuthItem("userTwitter", user.twitter || "");
            setAuthItem("userFacebook", user.facebook || "");
            setAuthItem("userTelegram", user.telegram || "");
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

            const updatedData = data.data;

            set((state) => {
                const isCurrent = state.currentUser?._id === uid;
                const nextCurrent = isCurrent
                    ? { ...state.currentUser, ...updatedData }
                    : state.currentUser;

                if (isCurrent) {
                    get().setCurrentUser(nextCurrent);
                }

                return {
                    users: state.users.map((user) => (user._id === uid ? updatedData : user)),
                    currentUser: nextCurrent,
                };
            });
            return { success: true, message: "User updated successfully!", data: updatedData };
        } catch (error) {
            console.error("Error updating user:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to update user. Please try again later.",
            };
        }
    },

    updateUserInfo: async (updatedInfo) => {
        const uid = updatedInfo._id; // Get user ID from updatedInfo
        try {
            const { data } = await axiosInstance.put(`/users/info/${uid}`, updatedInfo);
            if (!data.success) return { success: false, message: data.message };
    
            // Update currentUser in the store
            set((state) => {
                const nextCurrent = { ...state.currentUser, ...updatedInfo, ...data.data };
                get().setCurrentUser(nextCurrent);
                return {
                    currentUser: nextCurrent,
                    users: state.users.map((user) => (user._id === uid ? data.data : user)),
                };
            });
            return { success: true, message: "User information updated successfully!", data: data.data };
        } catch (error) {
            console.error("Error updating user information:", error);
            return { success: false, message: "Failed to update user information. Please try again later." };
        }
    }



}));
