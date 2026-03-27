const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const TOKEN_KEY = "solar_forecast_token";
const REFRESH_TOKEN_KEY = "solar_forecast_refresh_token";

// getStoredToken returns a persisted access token from local storage.
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

// setStoredToken persists access token for subsequent requests.
export function setStoredToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

// getStoredRefreshToken returns a persisted refresh token from local storage.
export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

// setStoredRefreshToken persists refresh token for subsequent requests.
export function setStoredRefreshToken(token) {
  if (!token) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

// tryRefreshTokens attempts a token rotation using the stored refresh token.
// Returns true and updates stored tokens on success, false on failure.
async function tryRefreshTokens() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      setStoredToken("");
      setStoredRefreshToken("");
      return false;
    }
    const payload = await response.json();
    setStoredToken(payload.access_token);
    setStoredRefreshToken(payload.refresh_token);
    return true;
  } catch {
    setStoredToken("");
    setStoredRefreshToken("");
    return false;
  }
}

// request sends an HTTP request to the backend API.
// On 401, it automatically attempts one token refresh and retries the request.
async function request(path, options = {}, isRetry = false) {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401 && !isRetry) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) return request(path, options, true);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "error" in payload ? payload.error : "Request failed";
    throw new Error(message);
  }

  return payload;
}

// register creates a user account and triggers email verification code delivery.
export function register(input) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// verifyEmail confirms OTP code and receives access + refresh tokens.
export function verifyEmail(input) {
  return request("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// resendVerification requests a new OTP verification code.
export function resendVerification(input) {
  return request("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// login authenticates a user account and receives access + refresh tokens.
export function login(input) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// logout revokes the refresh token server-side and clears local storage.
export async function logout() {
  const refreshToken = getStoredRefreshToken();
  try {
    await request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Ignore errors — clear local state regardless.
  }
  setStoredToken("");
  setStoredRefreshToken("");
}

// getMe fetches the current authenticated user profile.
export function getMe() {
  return request("/auth/me");
}

// forgotPassword triggers OTP delivery for password reset.
export function forgotPassword(input) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// resetPassword validates OTP and updates password.
export function resetPassword(input) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// createSolarProfile upserts the authenticated user's solar profile.
export function createSolarProfile(input) {
  return request("/solar-profiles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// updateSolarProfile updates one authenticated user's solar profile.
export function updateSolarProfile(profileID, input) {
  return request(`/solar-profiles/${profileID}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// deleteSolarProfile removes one authenticated user's solar profile.
export function deleteSolarProfile(profileID) {
  return request(`/solar-profiles/${profileID}`, {
    method: "DELETE",
  });
}

// buildQueryString converts an object into URL query string, skipping empty values.
function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

// getMySolarProfile fetches authenticated user's solar profile.
export function getMySolarProfile() {
  return request("/solar-profiles/me");
}

// getMySolarProfiles fetches all authenticated user's solar profiles.
export function getMySolarProfiles() {
  return request("/solar-profiles");
}

// getTodayForecast fetches or generates today's forecast for authenticated user.
export function getTodayForecast(params = {}) {
  return request(`/forecast/today${buildQueryString(params)}`);
}

// recordActualDaily stores one day of measured production for adaptive learning.
export function recordActualDaily(input) {
  return request("/forecast/actual", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// getForecastHistory fetches past forecast data for authenticated user.
export function getForecastHistory(params = {}) {
  return request(`/forecast/history${buildQueryString(params)}`);
}

// getActualHistory fetches past actual measurement data for authenticated user.
export function getActualHistory(params = {}) {
  return request(`/forecast/actuals/history${buildQueryString(params)}`);
}

// getDashboardSummary fetches performance metrics and KPIs for authenticated user.
export function getDashboardSummary() {
  return request("/forecast/summary");
}

// listDevices fetches all user-owned field devices.
export function listDevices() {
  return request("/devices");
}

// getDeviceHeartbeatSummary returns quick connectivity status for dashboard.
export function getDeviceHeartbeatSummary() {
  return request("/devices/heartbeat-summary");
}

// createDevice registers one field device and returns one-time api key.
export function createDevice(input) {
  return request("/devices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// updateDevice updates one user-owned field device.
export function updateDevice(deviceID, input) {
  return request(`/devices/${deviceID}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// deleteDevice removes one user-owned field device.
export function deleteDevice(deviceID) {
  return request(`/devices/${deviceID}`, {
    method: "DELETE",
  });
}

// rotateDeviceKey rotates one device api key and returns new key once.
export function rotateDeviceKey(deviceID) {
  return request(`/devices/${deviceID}/rotate-key`, {
    method: "POST",
  });
}

// getNotificationPreferences fetches channel preference configuration for authenticated user.
export function getNotificationPreferences() {
  return request("/notifications/preferences");
}

// updateNotificationPreferences upserts channel preference configuration for authenticated user.
export function updateNotificationPreferences(input) {
  return request("/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// getEnergyReport fetches cumulative energy and CO2 savings report for authenticated user.
export function getEnergyReport(params = {}) {
  return request(`/report/energy${buildQueryString(params)}`);
}

// adminGetUsers fetches all users with their current tier (Admin only).
export function adminGetUsers() {
  return request("/admin/users");
}

// adminUpdateUserTier updates one user's subscription tier (Admin only).
export function adminUpdateUserTier(userID, planTier) {
  return request(`/admin/users/${userID}/tier`, {
    method: "PUT",
    body: JSON.stringify({ plan_tier: planTier }),
  });
}

export function adminGetStats() {
  return request("/admin/stats");
}

export function adminImpersonateUser(userID) {
  return request(`/admin/users/${userID}/impersonate`, {
    method: "POST",
  });
}

export function adminGetExpiringSubscriptions(days = 7) {
  return request(`/admin/subscriptions/expiring?days=${days}`);
}

export function adminGetSchedulerStatus(limit = 50) {
  return request(`/admin/scheduler/status?limit=${limit}`);
}

export function adminGetForecastQuality() {
  return request("/admin/forecast-quality");
}

export function adminGetColdStartSites() {
  return request("/admin/cold-start-monitor");
}

export function adminGetNotificationLogs(limit = 50) {
  return request(`/admin/notification-logs?limit=${limit}`);
}

export function adminGetDataAnomalies() {
  return request("/admin/data-anomalies");
}

export function adminGetAggregateAnalytics(days = 30) {
  return request(`/admin/analytics/aggregate?days=${days}`);
}

export function adminGetSiteRankings(limit = 10) {
  return request(`/admin/analytics/ranking?limit=${limit}`);
}

export function adminGetTierDistribution() {
  return request("/admin/analytics/tier-distribution");
}

export function adminGetWeatherHealth() {
  return request("/admin/weather/health");
}

export function adminGetAuditLogs(limit = 100) {
  return request(`/admin/audit-logs?limit=${limit}`);
}

// listAPIKeys fetches all user API keys.
export function listAPIKeys() {
  return request("/api-keys");
}

// createAPIKey creates a new user API key.
export function createAPIKey(input) {
  return request("/api-keys", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// deleteAPIKey removes one user API key.
export function deleteAPIKey(keyID) {
  return request(`/api-keys/${keyID}`, {
    method: "DELETE",
  });
}

// initiateCheckout starts a Midtrans payment session for Pro/Enterprise tier.
export function initiateCheckout(planTier) {
  return request("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan_tier: planTier }),
  });
}

// getSubscriptionStatus fetches current user subscription and proactively checks for payment updates.
export function getSubscriptionStatus() {
  return request("/billing/subscription");
}

export function cancelSubscription() {
  return request("/billing/subscription/cancel", { method: "POST" });
}

export { API_BASE_URL };

export async function updateBranding(companyName, logoFile) {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("company_name", companyName);
  if (logoFile) {
    formData.append("logo", logoFile);
  }

  const response = await fetch(`${API_BASE_URL}/users/me/branding`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData,
  });
  
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "error" in payload ? payload.error : "Request failed";
    throw new Error(message);
  }
  return payload;
}

// getRECReadiness fetches the user's MWh accumulator and REC progress.
export function getRECReadiness() {
  return request("/accumulator/rec-readiness");
}

export async function downloadRECCertificate() {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/report/rec/pdf?type=certificate`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Gagal mengunduh sertifikat REC");
  const blob = await response.blob();
  saveBlob(blob, `REC_Certificate_${new Date().getTime()}.pdf`);
}

export async function downloadRECReadinessReport() {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/report/rec/pdf?type=report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Gagal mengunduh laporan REC Readiness");
  const blob = await response.blob();
  saveBlob(blob, `REC_Readiness_Report_${new Date().getTime()}.pdf`);
}

function saveBlob(blob, name) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
// getESGSummary fetches comprehensive corporate sustainability stats (Enterprise only).
export function getESGSummary(params = {}) {
  return request(`/report/esg${buildQueryString(params)}`);
}

export function downloadESGReportPDF(params = {}) {
  const token = getStoredToken();
  const url = `${API_BASE_URL}/report/esg/pdf${buildQueryString(params)}`;
  
  return fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  }).then(res => {
    if (!res.ok) throw new Error("Gagal download report");
    return res.blob();
  }).then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ESG_Report_${params.year || ""}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  });
}

export function downloadHistoryCSV(params = {}) {
  const token = getStoredToken();
  const url = `${API_BASE_URL}/report/history/csv${buildQueryString(params)}`;
  
  return fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  }).then(res => {
    if (!res.ok) throw new Error("Gagal download CSV");
    return res.blob();
  }).then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `History_Export_${params.start_date || ""}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  });
}

// ESG Public Share (E5-T6)
export function getESGShareStatus() {
  return request("/users/me/esg-share");
}

export function enableESGShare() {
  return request("/users/me/esg-share/enable", { method: "POST" });
}

export function disableESGShare() {
  return request("/users/me/esg-share/disable", { method: "POST" });
}

export function getPublicESGSummary(token, year) {
  const q = year ? `?year=${year}` : "";
  return request(`/public/esg/${token}${q}`);
}

// getCO2Summary fetches CO2 avoided summary with carbon credit estimate (Pro/Enterprise).
export function getCO2Summary(params = {}) {
  return request(`/report/co2${buildQueryString(params)}`);
}

// downloadMRVPDF downloads the MRV CO2 Avoided PDF report.
export async function downloadMRVPDF(params = {}) {
  const token = getStoredToken();
  const query = buildQueryString(params);
  const response = await fetch(`${API_BASE_URL}/report/co2/pdf${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Gagal mengunduh MRV Report");
  return response.blob();
}
