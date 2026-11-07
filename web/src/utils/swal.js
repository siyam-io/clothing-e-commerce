import Swal from 'sweetalert2';
import { toast as sonnerToast } from "sonner";

/**
 * Unified Notification System
 * Synchronized with globals.css Design Tokens
 */

const getSwalConfig = () => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  
  return {
    background: isDark ? 'oklch(0.1 0 0)' : 'oklch(1 0 0)',
    color: isDark ? 'oklch(0.985 0 0)' : 'oklch(0.145 0 0)',
    backdrop: isDark ? 'rgba(0,0,0,0.85) blur(12px)' : 'rgba(0,0,0,0.4) blur(4px)',
  };
};

const Modal = Swal.mixin({
  customClass: {
    popup: 'rounded-[3rem] border border-border/10 shadow-[0_25px_80px_rgba(0,0,0,0.4)] px-6 py-10 bg-card backdrop-blur-3xl',
    title: 'text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-foreground leading-none mb-4',
    htmlContainer: 'text-sm font-medium leading-relaxed text-muted-foreground mb-6',
    confirmButton: 'bg-foreground text-background px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-2xl mx-2',
    cancelButton: 'bg-accent/10 text-muted-foreground border border-border/10 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-rose-600 hover:text-white transition-all mx-2',
    actions: 'flex flex-wrap justify-center w-full gap-4 mt-4',
    icon: 'border-none scale-125 mb-4',
  },
  buttonsStyling: false,
});

export const notify = {
  // ⚡ Modern UI Toasts (Sonner)
  success: (message, description) => {
    sonnerToast.success(message, { 
      description,
      className: "rounded-2xl border-border bg-card text-foreground font-medium shadow-2xl",
    });
  },
  error: (message, description) => {
    sonnerToast.error(message, { 
      description,
      className: "rounded-2xl border-destructive/20 bg-destructive/5 text-destructive font-medium shadow-2xl",
    });
  },
  info: (message, description) => {
    sonnerToast.info(message, { 
      description,
      className: "rounded-2xl border-border bg-card text-foreground font-medium shadow-2xl",
    });
  },

  // 🛡️ Premium Modals (SweetAlert2)
  alert: (title, text, icon = 'info') => {
    const config = getSwalConfig();
    return Modal.fire({
      title,
      text,
      icon,
      ...config,
    });
  },

  // ⚠️ Strategic Confirmations
  confirm: async (title = 'Are you sure?', text = "This action cannot be undone.", type = 'warning') => {
    const config = getSwalConfig();
    const result = await Modal.fire({
      icon: type,
      title,
      text,
      ...config,
      showCancelButton: true,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    return result.isConfirmed;
  }
};

// 🏛️ Legacy Support (Redirection to new notify system)
export const swalConfirm = notify.confirm;
export const swalToast = (title, icon = 'success') => notify[icon === 'error' ? 'error' : 'success'](title);
export const swalError = (title, text) => notify.alert(title, text, 'error');
export const swalSuccess = (title, text) => notify.alert(title, text, 'success');