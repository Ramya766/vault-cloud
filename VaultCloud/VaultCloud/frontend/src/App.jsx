import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import AddServiceForm from "./components/AddServiceForm";
import Dashboard from "./components/Dashboard";
import ServicesTable from "./components/ServicesTable";
import BudgetPanel from "./components/BudgetPanel";
import MonthlyHistory from "./components/MonthlyHistory";
import ProtectedRoute from "./components/ProtectedRoute";

const API_BASE = "http://localhost:5000";

function App() {
  const [services, setServices] = useState([]);
  const [estimate, setEstimate] = useState({
    total_cost: 0,
    by_provider: [],
    by_service_type: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("vaultcloud_token");
      const [servicesRes, estimateRes] = await Promise.all([
        axios.get(`${API_BASE}/api/services`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/api/estimate`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setServices(servicesRes.data);
      setEstimate(estimateRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("vaultcloud_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("vaultcloud_token");
    if (token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAddService = async (serviceData) => {
    try {
      const token = localStorage.getItem("vaultcloud_token");
      await axios.post(`${API_BASE}/api/services`, serviceData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
    } catch (error) {
      console.error("Error adding service:", error);
      throw error;
    }
  };

  const handleDeleteService = async (id) => {
    try {
      const token = localStorage.getItem("vaultcloud_token");
      await axios.delete(`${API_BASE}/api/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vaultcloud_token");
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout
              services={services}
              estimate={estimate}
              loading={loading}
              onAddService={handleAddService}
              onDeleteService={handleDeleteService}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function DashboardLayout({
  services,
  estimate,
  loading,
  onAddService,
  onDeleteService,
  onLogout,
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Vault + Cloud Icon */}
              <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-vault-500 to-vault-700 rounded-xl shadow-lg shadow-vault-500/25">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
                  />
                </svg>
                <svg
                  className="w-3 h-3 text-white/90 absolute -bottom-0.5 -right-0.5 bg-vault-600 rounded-full p-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Vault<span className="text-vault-600">Cloud</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium -mt-0.5">
                  Every rupee in the cloud, accounted.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => (window.location.href = "/profile")}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Profile
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-vault-600 hover:bg-vault-700 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-vault-200 border-t-vault-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading VaultCloud...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Add Service Form */}
            <AddServiceForm onAddService={onAddService} />

            {/* Budget Panel */}
            <BudgetPanel />

            {/* Dashboard */}
            <Dashboard estimate={estimate} />

            {/* Monthly History */}
            <MonthlyHistory />

            {/* Services Table */}
            <ServicesTable
              services={services}
              onDeleteService={onDeleteService}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              © 2026 VaultCloud — Multi-Cloud Cost Estimator
            </p>
            <p className="text-xs text-gray-400">
              Pricing data is for estimation purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
