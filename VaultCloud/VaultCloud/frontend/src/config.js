// Centralized API configuration
// In production, VITE_API_URL is set during the build via GitHub Actions.
// In local development, it falls back to the live backend to prevent CORS issues.
const API_BASE = import.meta.env.VITE_API_URL || "https://vaultcloud-g7excna4gwf6hddt.centralindia-01.azurewebsites.net";

export default API_BASE;
