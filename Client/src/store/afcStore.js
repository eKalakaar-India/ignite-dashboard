import { create } from 'zustand';
import axiosClient from "../api/axiosClient";
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4100').replace(/\/$/, '');
axios.defaults.baseURL = API_BASE_URL;

const normalizeApiResponse = (payload) => payload?.data ?? payload;
const getErrorMessage = (error) =>
  error?.response?.data?.errors?.[0]?.message ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'Request failed';

// // Helper to set headers
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Check local storage
const cachedToken = localStorage.getItem('afc_token');
const cachedUser = localStorage.getItem('afc_user') ? JSON.parse(localStorage.getItem('afc_user')) : {};
if (cachedToken) {
  setAuthHeader(cachedToken);
}

export const useAFCStore = create((set, get) => ({
  // Auth state
  token: cachedToken,
  user: cachedUser,
  isAuthenticated: !!cachedToken,
  authError: null,
  authLoading: false,

  // Users state (admin user management)
  users: [],
  usersLoading: false,
  addUserLoading: false,
  addUserError: null,

  dashboard: null,
  dashboardLoading: false,
  dashboardError: null,
  performance: null,
  performanceLoading: false,
  performanceError: null,
  sessionCreateLoading: false,
  sessionCreateError: null,
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,
  isUploading:false,
  uploadError:null,
  // AUTH ACTIONS
  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const payload = normalizeApiResponse(response.data);
      console.log(payload);
      const token = payload?.token;
      const user = payload?.user;

      if (!token) {
        throw new Error('No authentication token returned by the server.');
      }

      localStorage.setItem('afc_token', token);
      localStorage.setItem('afc_user', JSON.stringify(user || {}));
    //   setAuthHeader(token);
      set({ token, user: user || null, isAuthenticated: true, authLoading: false });
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ authError: message, authLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('afc_token');
    localStorage.removeItem('afc_user');
    setAuthHeader(null);
    set({ token: null, user: null, isAuthenticated: false });
    return true;
  },

  // USER MANAGEMENT ACTIONS
  fetchUsers: async () => {
    set({ usersLoading: true });
    try {
      const response = await axiosClient.get('/auth/fetch');
      const payload = normalizeApiResponse(response.data);
      set({ users: payload || [], usersLoading: false });
    } catch (error) {
      console.error('Failed to load users:', error);
      set({ users: [], usersLoading: false });
    }
  },

  addUser: async (name, email, phone_no, password, role) => {
    set({ addUserLoading: true, addUserError: null });
    try {
      const response = await axiosClient.post('/auth/register', { name, email, phone_no, password, role });
      const normalized = normalizeApiResponse(response.data);
      set((state) => ({
        users: normalized ? [normalized, ...state.users] : state.users,
        addUserLoading: false,
      }));
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ addUserError: message, addUserLoading: false });
      return false;
    }
  },

  clearAddUserError: () => set({ addUserError: null }),

  fetchDashboard: async () => {
    set({ dashboardLoading: true, dashboardError: null });
    try {
      const response = await axiosClient.get('/dashboard');
      console.log('Dashboard response:', response.data);
      const payload = normalizeApiResponse(response.data);
      set({ dashboard: payload, dashboardLoading: false });
      return payload;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ dashboard: null, dashboardError: message, dashboardLoading: false });
      return null;
    }
  },

  fetchPerformance: async () => {
    set({ performanceLoading: true, performanceError: null });
    try {
      const response = await axiosClient.get('/dashboard/performance');
      const payload = normalizeApiResponse(response.data);
      set({ performance: payload, performanceLoading: false });
      return payload;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ performance: null, performanceError: message, performanceLoading: false });
      return null;
    }
  },

  createSession: async (sessionData, selectedUploads = {}, qualitativeReport = null) => {
    set({ sessionCreateLoading: true, sessionCreateError: null });
    try {
      const formData = new FormData();
      formData.append('sessionData', JSON.stringify(sessionData));
      if (qualitativeReport) {
        formData.append('qualitativeReport', JSON.stringify(qualitativeReport));
      }
      const uploadFields = {
        session_images: 'session_images',
        geo_tagged_photos: 'geo_tagged_photos',
        attendance_sheets: 'attendance_sheets',
        consent_forms: 'consent_forms',
        feedback_forms: 'feedback_forms',
      };
      Object.entries(uploadFields).forEach(([category, fieldName]) => {
        (selectedUploads[category] || []).forEach((file) => {
          formData.append(fieldName, file, file.name);
        });
      });

      const response = await axiosClient.post('/session/create-session', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const payload = normalizeApiResponse(response.data);
      set({ sessionCreateLoading: false });
      return payload;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ sessionCreateError: message, sessionCreateLoading: false });
      throw new Error(message);
    }
  },

  updateSession: async (sessionId, sessionData) => {
    try {
      const response = await axiosClient.patch(`/session/update-session/${sessionId}`, sessionData);
      return normalizeApiResponse(response.data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  fetchSessionById: async (sessionId) => {
    try {
      const response = await axiosClient.get(`/session/${sessionId}`);
      return normalizeApiResponse(response.data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  fetchSessionDocumentation: async (sessionId) => {
    try {
      const response = await axiosClient.get(`/uploads/session/${sessionId}/documentation`);
      return normalizeApiResponse(response.data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  fetchSessionDocumentationForSessions: async (sessionIds) => {
    try {
      const response = await axiosClient.post('/uploads/sessions/documentation', { sessionIds });
      return normalizeApiResponse(response.data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createQualitativeAnalysis: async (analysisData) => {
    try {
      const response = await axiosClient.post('/session/qualitative', analysisData);
      return normalizeApiResponse(response.data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  clearSessionCreateError: () => set({ sessionCreateError: null }),

  fetchSessions: async () => {
    set({ sessionsLoading: true, sessionsError: null });
    try {
      let user = get().user;
      let route = '';
      if(user.role === 'Super Admin'){
        route = '/session/fetchall';
      } else {
        route = '/session/fetchby-expert/' + user.id;
      }
      const response = await axiosClient.get(route);
      const payload = normalizeApiResponse(response.data);
      set({ sessions: Array.isArray(payload) ? payload : [], sessionsLoading: false });
      return payload;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ sessions: [], sessionsError: message, sessionsLoading: false });
      return null;
    }
  },
  fetchExpertSessions: async (id) => {
    set({ sessionsLoading: true, sessionsError: null });
    try {
      let user = get().user;
      let route = '';
      if(user.role === 'Super Admin'){
        route = `/session/fetchby-expert/${id}`;
      } else {
        route = '/session/fetchby-expert/' + user.id;
      }
      const response = await axiosClient.get(route);
      const payload = normalizeApiResponse(response.data);
      set({ sessions: Array.isArray(payload) ? payload : [], sessionsLoading: false });
      return payload;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ sessions: [], sessionsError: message, sessionsLoading: false });
      return null;
    }
  },

  uploadImages: async(folder, files, id)=>{
    const selectedFiles = Array.isArray(files) ? files : [files];
    if (selectedFiles.length === 0 || selectedFiles.length > 5) {
      const message = 'Select between 1 and 5 images per upload.';
      set({ isUploading: false, uploadError: message });
      throw new Error(message);
    }
    if (selectedFiles.some((file) => !(file instanceof File))) {
      const message = 'Select valid image files before uploading.';
      set({ isUploading: false, uploadError: message });
      throw new Error(message);
    }
    if (!id) {
      const message = 'A session ID is required to upload files.';
      set({ isUploading: false, uploadError: message });
      throw new Error(message);
    }

    set({ isUploading: true, uploadError: null });
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('images', file, file.name));
    formData.append('sessionId', id);

    try{
      const response = await axiosClient.post(`/uploads/${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = normalizeApiResponse(response.data);
      set((state) => ({
        sessions: result?.session
          ? state.sessions.map((session) => session.id === result.session.id ? result.session : session)
          : state.sessions,
        isUploading: false,
      }));
      return result;
    }catch(error){
      console.error('Document upload failed:', error);
      const message = getErrorMessage(error);
      set({ uploadError: message, isUploading: false });
      throw new Error(message);
    }

  }
}));