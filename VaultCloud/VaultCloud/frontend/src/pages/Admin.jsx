import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Pie, Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import API_BASE from "../config";

ChartJS.register(
  ArcElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("vaultcloud_token");
    navigate("/login");
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setErrorMessage("");
      const token = localStorage.getItem("vaultcloud_token");
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      const status = error.response?.status;
      if (status === 401) {
        setErrorMessage("Session expired. Please log in again.");
      } else if (status === 403) {
        setErrorMessage(
          "Admin access required. Sign in with an admin account or register via /api/auth/admin/signup.",
        );
      } else {
        setErrorMessage("Failed to load admin data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const pieData = useMemo(() => {
    if (!stats) return null;
    const providers = stats.by_provider || [];

    return {
      labels: providers.map((p) => p.provider),
      datasets: [
        {
          data: providers.map((p) => p.total),
          backgroundColor: [
            "rgba(245, 158, 11, 0.8)", // AWS/Orange
            "rgba(59, 130, 246, 0.8)", // Azure/Blue
            "rgba(239, 68, 68, 0.8)", // GCP/Red
            "rgba(168, 85, 247, 0.8)", // Others
          ],
          borderColor: [
            "rgba(245, 158, 11, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(168, 85, 247, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  const trendData = useMemo(() => {
    if (!stats) return null;
    const monthlyTrend = stats.monthly_trend || [];

    return {
      labels: monthlyTrend.map((t) => `${t.month} ${t.year}`),
      datasets: [
        {
          label: "Total Platform Cost (₹)",
          data: monthlyTrend.map((t) => t.total),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-vault-200 border-t-vault-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading Platform Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <p className="text-sm text-red-600 font-medium">
          {errorMessage || "Failed to load stats."}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-vault-600 hover:bg-vault-700 rounded-md"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Overview</h2>
          <p className="text-sm text-gray-500">Platform-wide statistics and usage data across all users.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-vault-600 hover:bg-vault-700 rounded-md self-start"
        >
          Logout
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_users}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Global Estimated Revenue/Cost</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{(stats.total_cost || 0).toFixed(4)}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Services Added</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_services}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 hidden sm:grid">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Revenue by Provider</h3>
          <div className="h-64 flex justify-center">
             {(stats.by_provider || []).length > 0 ? (
                <Pie 
                  data={pieData} 
                  options={{ 
                    maintainAspectRatio: false, 
                    plugins: { legend: { position: "bottom" } } 
                  }} 
                />
             ) : (
                <span className="text-gray-400 my-auto">No data</span>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Monthly Trend</h3>
          <div className="h-64">
            {(stats.monthly_trend || []).length > 0 ? (
              <Line 
                data={trendData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            ) : (
              <span className="text-gray-400 my-auto flex justify-center h-full items-center">No data</span>
            )}
          </div>
        </div>
      </div>

      {/* Registered Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">Registered Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services track</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Est. Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.service_count} resources</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                    ₹{Number(user.total_spent).toFixed(4)}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                   <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">Platform Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider / Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added On</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recent_services?.map((svc) => (
                <tr key={svc.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{svc.user_name}</div>
                    <div className="text-xs text-gray-500">{svc.user_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ring-gray-200 bg-white mr-2">
                       {svc.provider}
                    </span>
                    <span className="text-sm text-gray-500">{svc.service_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(svc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                    ₹{(svc.cost).toFixed(6)}
                  </td>
                </tr>
              ))}
              {stats.recent_services?.length === 0 && (
                <tr>
                   <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">No recent services added across platform</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="h-4"></div>
    </div>
  );
}

export default Admin;
