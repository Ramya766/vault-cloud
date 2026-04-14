import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AddServiceForm from './components/AddServiceForm';
import Dashboard from './components/Dashboard';
import ServicesTable from './components/ServicesTable';

const API_BASE = 'http://localhost:5000';

function App() {
  const [services, setServices] = useState([]);
  const [estimate, setEstimate] = useState({ total_cost: 0, by_provider: [], by_service_type: [] });
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [servicesRes, estimateRes, providersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/services`),
        axios.get(`${API_BASE}/api/estimate`),
        axios.get(`${API_BASE}/api/providers`)
      ]);
      setServices(servicesRes.data);
      setEstimate(estimateRes.data);
      setProviders(providersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddService = async (serviceData) => {
    try {
      await axios.post(`${API_BASE}/api/services`, serviceData);
      await fetchData();
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/services/${id}`);
      await fetchData();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Vault + Cloud Icon */}
              <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-vault-500 to-vault-700 rounded-xl shadow-lg shadow-vault-500/25">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                </svg>
                <svg className="w-3 h-3 text-white/90 absolute -bottom-0.5 -right-0.5 bg-vault-600 rounded-full p-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
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
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-vault-50 text-vault-700 border border-vault-200">
                Multi-Cloud Estimator
              </span>
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
            <AddServiceForm
              providers={providers}
              onAddService={handleAddService}
            />

            {/* Dashboard */}
            <Dashboard estimate={estimate} />

            {/* Services Table */}
            <ServicesTable
              services={services}
              onDeleteService={handleDeleteService}
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
