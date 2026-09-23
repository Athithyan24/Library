import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUi = create(
  persist(
    (set) => ({
      collapsed: false,
      dark: false,
      palette: false,
      notices: false,
      mobileNav: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleDark: () =>
        set((state) => {
          const dark = !state.dark;
          document.documentElement.classList.toggle('dark', dark);
          return { dark };
        }),
      setPalette: (palette) => set({ palette }),
      setNotices: (notices) => set({ notices }),
      setMobileNav: (mobileNav) => set({ mobileNav }),
    }),
    { name: 'reading-room-ui', partialize: (state) => ({ collapsed: state.collapsed, dark: state.dark }) }
  )
);
