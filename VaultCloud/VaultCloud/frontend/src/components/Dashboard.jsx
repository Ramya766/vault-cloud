import { useMemo } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const PROVIDER_CHART_COLORS = {
  AWS: { bg: "rgba(245, 158, 11, 0.8)", border: "rgba(245, 158, 11, 1)" },
  Azure: { bg: "rgba(59, 130, 246, 0.8)", border: "rgba(59, 130, 246, 1)" },
  GCP: { bg: "rgba(239, 68, 68, 0.8)", border: "rgba(239, 68, 68, 1)" },
};

const SERVICE_COLORS = [
  "rgba(99, 102, 241, 0.8)",
  "rgba(16, 185, 129, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(239, 68, 68, 0.8)",
  "rgba(139, 92, 246, 0.8)",
  "rgba(236, 72, 153, 0.8)",
  "rgba(20, 184, 166, 0.8)",
  "rgba(249, 115, 22, 0.8)",
  "rgba(34, 197, 94, 0.8)",
  "rgba(168, 85, 247, 0.8)",
  "rgba(14, 165, 233, 0.8)",
  "rgba(244, 63, 94, 0.8)",
];

function Dashboard({ estimate }) {
  const { total_cost, by_provider, by_service_type } = estimate;

  const pieData = useMemo(
    () => ({
      labels: by_provider.map((p) => p.provider),
      datasets: [
        {
          data: by_provider.map((p) => p.total),
          backgroundColor: by_provider.map(
            (p) =>
              PROVIDER_CHART_COLORS[p.provider]?.bg ||
              "rgba(156, 163, 175, 0.8)",
          ),
          borderColor: by_provider.map(
            (p) =>
              PROVIDER_CHART_COLORS[p.provider]?.border ||
              "rgba(156, 163, 175, 1)",
          ),
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    }),
    [by_provider],
  );

  const barData = useMemo(
    () => ({
      labels: by_service_type.map((s) => `${s.service_type} (${s.provider})`),
      datasets: [
        {
          label: "Cost (₹)",
          data: by_service_type.map((s) => s.total),
          backgroundColor: by_service_type.map(
            (_, i) => SERVICE_COLORS[i % SERVICE_COLORS.length],
          ),
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 36,
        },
      ],
    }),
    [by_service_type],
  );

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { family: "Inter", size: 12, weight: "500" },
          color: "#374151",
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { family: "Inter", size: 13 },
        bodyFont: { family: "Inter", size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.label}: ₹${ctx.parsed.toFixed(4)}`,
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { family: "Inter", size: 13 },
        bodyFont: { family: "Inter", size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `Cost: ₹${ctx.parsed.y.toFixed(4)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "Inter", size: 11 },
          color: "#6b7280",
        },
      },
      y: {
        grid: { color: "rgba(243, 244, 246, 1)" },
        ticks: {
          font: { family: "Inter", size: 11 },
          color: "#6b7280",
          callback: (value) => `₹${value}`,
        },
        beginAtZero: true,
      },
    },
  };

  const hasData = by_provider.length > 0;

  return (
    <section id="dashboard-section" className="space-y-6">
      {/* Total Cost Card */}
      <div className="bg-gradient-to-br from-vault-600 via-vault-700 to-vault-800 rounded-2xl p-6 text-white shadow-xl shadow-vault-600/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-vault-200 text-sm font-medium mb-1">
              Total Estimated Cost
            </p>
            <p className="text-4xl font-bold tracking-tight">
              ₹{total_cost.toFixed(4)}
            </p>
            <p className="text-vault-300 text-sm mt-2 flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
              </svg>
              Across {by_provider.length} provider
              {by_provider.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl">
            <svg
              className="w-8 h-8 text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
              />
            </svg>
          </div>
        </div>

        {/* Provider Mini Breakdown */}
        {hasData && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {by_provider.map((p) => (
              <div
                key={p.provider}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3"
              >
                <p className="text-xs text-vault-200 font-medium">
                  {p.provider}
                </p>
                <p className="text-lg font-bold mt-0.5">
                  ₹{p.total.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Cost by Provider
                </h3>
                <p className="text-xs text-gray-500">
                  Distribution across cloud providers
                </p>
              </div>
            </div>
            <div className="h-64">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Cost by Service Type
                </h3>
                <p className="text-xs text-gray-500">
                  Breakdown per individual service
                </p>
              </div>
            </div>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <h3 className="text-gray-600 font-medium mb-1">No data yet</h3>
          <p className="text-sm text-gray-400">
            Add cloud services above to see cost breakdowns and charts
          </p>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
