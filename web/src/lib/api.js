// src/lib/api.js
import axios from 'axios';
import { getGuestId } from '@/utils/guestId';
import { getCookie } from '@/utils/cookies';
import { useUploadStore } from '@/store/uploadStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Add token, guest ID, and brand context to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? (getCookie('vanguard_auth_token') || getCookie('token') || localStorage.getItem('token'))
    : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Always send guest ID if available as a secondary identity/context
  const guestId = getGuestId();
  if (guestId) {
    config.headers['x-guest-id'] = guestId;
  }

  // Add Multi-Tenant Context Headers
  if (typeof window !== 'undefined') {
    const html = document.documentElement;
    config.headers['x-vanguard-theme'] = html.getAttribute('data-theme') || 'executive';
  }

  // Track upload progress for mutations (POST, PUT, PATCH) that are either FormData uploads or explicitly opted-in
  if (typeof window !== 'undefined' && ['post', 'put', 'patch'].includes(config.method?.toLowerCase())) {
    const isFormData = config.data instanceof FormData;
    const shouldTrack = isFormData || config.trackProgress === true;

    if (shouldTrack && config.trackProgress !== false) {
      const store = useUploadStore.getState();
      
      let uploadName = 'Saving changes...';
      if (isFormData) {
        uploadName = 'Uploading files...';
        if (config.data.has('logo') || config.data.has('logoDark') || config.data.has('favicon')) {
          uploadName = 'Uploading branding assets...';
        } else if (config.data.has('images') || config.data.has('image')) {
          uploadName = 'Uploading images...';
        } else if (config.data.has('avatar')) {
          uploadName = 'Uploading avatar image...';
        }
      }

      store.startUpload(uploadName);

      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          store.setProgress(percent);
        } else {
          store.setProgress(50);
        }
      };
    }
  }

  return config;
});

// Response interceptors to finish/cleanup upload states
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      useUploadStore.getState().endUpload();
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      useUploadStore.getState().endUpload();
    }
    return Promise.reject(error);
  }
);

export default api;