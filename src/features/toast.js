/**
 * Toast notifications: transient bottom-center status messages.
 */
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = toast.querySelector('i');
let toastTimer;

export function showToast(msg, icon = 'fa-circle-info') {
  toastMsg.textContent = msg;
  toastIcon.className = `fa-solid ${icon}`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}
