import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE from "../config";

function BudgetPanel() {
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);
  const [settingBudget, setSettingBudget] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState("");

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem("vaultcloud_token");
      const response = await axios.get(`${API_BASE}/api/budget`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgets(response.data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async (provider) => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) return;

    try {
      const token = localStorage.getItem("vaultcloud_token");
      await axios.post(
        `${API_BASE}/api/budget`,
        {
          provider,
          monthly_limit: parseFloat(budgetAmount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSettingBudget(null);
      setBudgetAmount("");
      fetchBudgets();
    } catch (error) {
      console.error("Error setting budget:", error);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 90) return "bg-red-400";
    if (percentage >= 70) return "bg-yellow-400";
    return "bg-green-500";
  };

  const getAlertMessage = (provider, percentage) => {
    if (percentage >= 100) return `🚨 ${provider} budget exceeded!`;
    if (percentage >= 90) return `⚠️ ${provider} budget ${percentage}% used!`;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-vault-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2v20m9-9H3"
              />
            </svg>
            <h2 className="text-base font-semibold text-gray-900">
              Budget Limits
            </h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-vault-200 border-t-vault-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  const alerts = Object.entries(budgets)
    .map(([provider, data]) => getAlertMessage(provider, data.percentage))
    .filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-vault-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2v20m9-9H3"
            />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">
            Budget Limits
          </h2>
        </div>
      </div>

      <div className="p-6">
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
              >
                {alert}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {["AWS", "Azure", "GCP"].map((provider) => {
            const budget = budgets[provider];
            const hasBudget = budget && budget.limit > 0;

            return (
              <div key={provider} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {provider}
                  </span>
                  {hasBudget ? (
                    <button
                      onClick={() => setSettingBudget(provider)}
                      className="text-xs text-vault-600 hover:text-vault-700"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => setSettingBudget(provider)}
                      className="text-xs text-vault-600 hover:text-vault-700"
                    >
                      Set Budget
                    </button>
                  )}
                </div>

                {settingBudget === provider ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Monthly limit in ₹"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-vault-500 focus:border-vault-500"
                    />
                    <button
                      onClick={() => handleSetBudget(provider)}
                      className="px-3 py-2 bg-vault-600 text-white text-sm rounded-md hover:bg-vault-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setSettingBudget(null);
                        setBudgetAmount("");
                      }}
                      className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : hasBudget ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        ₹{budget.spent.toFixed(2)} / ₹{budget.limit.toFixed(2)}
                      </span>
                      <span>{budget.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(budget.percentage)}`}
                        style={{
                          width: `${Math.min(budget.percentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No budget set</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BudgetPanel;
