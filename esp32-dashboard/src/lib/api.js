import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:1880/api',
  timeout: 5000,
});

export const fetchDevices = () => api.get('/devices').then(res => res.data.devices);
export const fetchDeviceDetail = (id) => api.get(`/devices/${id}`).then(res => res.data);