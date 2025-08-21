import axios from 'axios';
const http = axios.create({ baseURL: 'http://localhost:4000' });

// License onboarding
export async function enterLicense(body: { licenseKey: string; deviceTag?: string; hostId?: string }) {
  const { data } = await http.post('/api/enter-license', body);
  return data;
}
export async function licenseState() {
  const { data } = await http.get('/api/license-state');
  return data;
}
export async function clearLicense() {
  const { data } = await http.post('/api/clear-license', {});
  return data;
}
// Premium feature checks
export async function callExportPDF() {
  const { data } = await http.get('/api/feature/exportPDF');
  return data;
}
export async function callDarkMode() {
  const { data } = await http.get('/api/feature/darkMode');
  return data;
}
