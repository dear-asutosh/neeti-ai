import Swal from 'sweetalert2';

export const StyledSwal = Swal.mixin({
  customClass: {
    popup: 'dark:bg-zinc-900 bg-white border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl',
    title: 'text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight',
    htmlContainer: 'text-zinc-500 dark:text-zinc-400 text-base leading-relaxed mt-2',
    confirmButton: 'px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] outline-none border-none',
    cancelButton: 'px-8 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold rounded-2xl transition-all active:scale-[0.98] outline-none border-none mr-2',
    actions: 'flex gap-3 mt-8',
  },
  buttonsStyling: false,
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  backdrop: `
    rgba(0,0,0,0.4)
    backdrop-filter: blur(8px);
  `,
  showClass: {
    popup: 'animate-in zoom-in-95 duration-300'
  },
  hideClass: {
    popup: 'animate-out zoom-out-95 duration-200'
  }
});

export const confirmDelete = async (title, text) => {
  return StyledSwal.fire({
    title: title || 'Are you sure?',
    text: text || "You won't be able to revert this!",
    icon: 'warning',
    iconColor: '#ef4444',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel'
  });
};

export const confirmAction = async (title, text, confirmText = 'Confirm', status = 'question') => {
  return StyledSwal.fire({
    title,
    text,
    icon: status,
    iconColor: status === 'warning' ? '#f59e0b' : '#6366f1',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel'
  });
};
