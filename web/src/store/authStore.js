import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/lib/api";
import { useProductStore } from "@/store/productStore";
import { setCookie, getCookie, deleteCookie } from "@/utils/cookies";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });

          if (data.token) {
            setCookie("vanguard_auth_token", data.token, 7);
            setCookie("token", data.token, 7);
            localStorage.setItem("token", data.token);
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          await useProductStore.getState().syncGuestDataWithUser();

          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async (token) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/google-login", {
            idToken: token,
            accessToken: token,
          });

          if (data.token) {
            setCookie("vanguard_auth_token", data.token, 7);
            setCookie("token", data.token, 7);
            localStorage.setItem("token", data.token);
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          await useProductStore.getState().syncGuestDataWithUser();

          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithFacebook: async (accessToken) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/facebook-login", { accessToken });

          if (data.token) {
            setCookie("vanguard_auth_token", data.token, 7);
            setCookie("token", data.token, 7);
            localStorage.setItem("token", data.token);
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          await useProductStore.getState().syncGuestDataWithUser();

          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        deleteCookie("vanguard_auth_token");
        deleteCookie("token");
        localStorage.removeItem("token");

        useProductStore.getState().resetStore();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      checkSession: async () => {
        const token = getCookie("vanguard_auth_token") || getCookie("token") || localStorage.getItem("token");
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const { data } = await api.get("/auth/me");
          set({
            user: data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          await useProductStore.getState().syncWithServer();
        } catch (error) {
          console.error("Session check failed:", error.message);
          // Only logout if it's a clear authentication error (401 or 403)
          if (error.response && [401, 403].includes(error.response.status)) {
            get().logout();
          } else {
            set({ isLoading: false });
          }
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/register", {
            name,
            email,
            password,
          });

          if (data.token) {
            setCookie("vanguard_auth_token", data.token, 7);
            setCookie("token", data.token, 7);
            localStorage.setItem("token", data.token);
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });

            await useProductStore.getState().syncGuestDataWithUser();
          } else {
            set({ isLoading: false });
          }

          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email) => {
        return (await api.post("/auth/forgot-password", { email })).data;
      },

      resetPassword: async (token, password) => {
        return (
          await api.post(`/auth/reset-password?token=${token}`, { password })
        ).data;
      },
    }),
    {
      name: "auth-vault",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
