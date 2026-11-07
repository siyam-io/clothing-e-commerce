export const setCookie = (name, value, days = 30) => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  document.cookie = name + "=" + (encodeURIComponent(value || "")) + expires + "; path=/; SameSite=Lax" + (isSecure ? "; Secure" : "");
};

export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

export const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
};
