import { useState, useEffect } from "react";

const PROVIDER_COLORS = {
  AWS: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  Azure: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
  },
  GCP: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
  },
};

const SERVICES = {
  AWS: ["EC2", "S3", "RDS", "Lambda"],
  Azure: ["VM", "Blob", "SQL", "Functions"],
  GCP: ["Compute", "GCS", "CloudSQL", "Functions"],
};

const UNITS = {
  EC2: "hrs",
  S3: "GB",
  RDS: "hrs",
  Lambda: "requests",
  VM: "hrs",
  Blob: "GB",
  SQL: "hrs",
  Functions: "requests",
  Compute: "hrs",
  GCS: "GB",
  CloudSQL: "hrs",
};

function AddServiceForm({ onAddService }) {
  const [form, setForm] = useState({
    provider: "",
    serviceType: "",
    usage: "",
    unit: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (form.provider) {
      setForm((prev) => ({ ...prev, serviceType: "", unit: "" }));
    }
  }, [form.provider]);

  useEffect(() => {
    if (form.serviceType) {
      setForm((prev) => ({ ...prev, unit: UNITS[form.serviceType] || "" }));
    }
  }, [form.serviceType]);

  const handleProviderChange = (value) => {
    setForm({ ...form, provider: value, serviceType: "", unit: "" });
  };

  const handleServiceTypeChange = (value) => {
    setForm({ ...form, serviceType: value, unit: UNITS[value] || "" });
  };

  const handleUsageChange = (value) => {
    setForm({ ...form, usage: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.provider ||
      !form.serviceType ||
      !form.usage ||
      parseFloat(form.usage) <= 0
    ) {
      setError("Please fill in all fields with valid values.");
      return;
    }

    setSubmitting(true);
    try {
      await onAddService({
        provider: form.provider,
        service_type: form.serviceType,
        usage: parseFloat(form.usage),
      });
      setForm({
        provider: "",
        serviceType: "",
        usage: "",
        unit: "",
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError("Failed to add service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedColor = PROVIDER_COLORS[form.provider] || {};

  return (
    <section id="add-service-section">
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <h2 className="text-base font-semibold text-gray-900">
              Add Cloud Service
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 ml-7">
            Select a provider and service to estimate costs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Cloud Provider Dropdown */}
          <div className="mb-6">
            <label
              htmlFor="provider-select"
              className="block text-sm font-medium text-gray-700 mb-3"
            >
              Cloud Provider
            </label>
            <select
              id="provider-select"
              value={form.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 focus:outline-none transition-colors"
            >
              <option value="">Select provider...</option>
              <option value="AWS">AWS</option>
              <option value="Azure">Azure</option>
              <option value="GCP">GCP</option>
            </select>
          </div>

          {/* Service Type + Usage Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label
                htmlFor="service-type-select"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Service Type
              </label>
              <select
                id="service-type-select"
                value={form.serviceType}
                onChange={(e) => handleServiceTypeChange(e.target.value)}
                disabled={!form.provider}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
              >
                <option value="">Select service...</option>
                {(SERVICES[form.provider] || []).map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="usage-input"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Usage Amount
              </label>
              <div className="relative">
                <input
                  id="usage-input"
                  type="number"
                  min="0"
                  step="any"
                  value={form.usage}
                  onChange={(e) => handleUsageChange(e.target.value)}
                  placeholder="Enter usage..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Unit
              </label>
              <div className="flex items-center h-[42px] px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600">
                {form.unit ? (
                  <span className="font-medium">{form.unit}</span>
                ) : (
                  <span className="text-gray-400">Select service first</span>
                )}
              </div>
            </div>
          </div>

          {/* Cost Preview - Removed since no rates provided */}

          {/* Error / Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              Service added successfully!
            </div>
          )}

          {/* Submit Button */}
          <button
            id="add-service-btn"
            type="submit"
            disabled={
              submitting || !form.provider || !form.serviceType || !form.usage
            }
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-vault-600 to-vault-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-vault-600/25 hover:from-vault-700 hover:to-vault-800 focus:ring-2 focus:ring-vault-500/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add Service
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AddServiceForm;
