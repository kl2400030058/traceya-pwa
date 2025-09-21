'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auditLogService, AuditLogEntry } from '@/services/auditlogservice';
import { authManager } from '@/lib/auth';
import { MFAGuard } from '@/components/mfa-guard';

const AuditLogsPage: React.FC = () => {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
    keyword: ''
  });

  const ITEMS_PER_PAGE = 50;

  // Load logs on component mount and when filters or page changes
  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare search criteria from filters
      const criteria: any = {};
      if (filters.userId) criteria.userId = filters.userId;
      if (filters.action) criteria.action = filters.action;
      if (filters.resource) criteria.resource = filters.resource;
      if (filters.startDate) criteria.startDate = new Date(filters.startDate).getTime();
      if (filters.endDate) criteria.endDate = new Date(filters.endDate).getTime();
      if (filters.keyword) criteria.keyword = filters.keyword;

      // Check if any filters are applied
      const hasFilters = Object.values(criteria).some(value => value !== undefined && value !== '');

      // Get logs based on filters
      let fetchedLogs;
      if (hasFilters) {
        fetchedLogs = await auditLogService.searchLogs(
          criteria,
          ITEMS_PER_PAGE,
          page * ITEMS_PER_PAGE
        );
      } else {
        fetchedLogs = await auditLogService.getAllLogs(
          ITEMS_PER_PAGE,
          page * ITEMS_PER_PAGE
        );
      }

      // Update state
      setLogs(fetchedLogs);
      setHasMore(fetchedLogs.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset to first page
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resource: '',
      startDate: '',
      endDate: '',
      keyword: ''
    });
    setPage(0);
    loadLogs();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDetails = (details: any) => {
    if (!details) return 'No details';
    try {
      return JSON.stringify(details, null, 2);
    } catch (e) {
      return 'Invalid details format';
    }
  };

  return (
    <MFAGuard requiredRoles={['admin', 'super_admin']}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>
        
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="Filter by user ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
                <option value="mfa_verified">MFA Verified</option>
                <option value="mfa_failed">MFA Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
              <select
                name="resource"
                value={filters.resource}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Resources</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="certificate">Certificate</option>
                <option value="batch">Batch</option>
                <option value="fir">FIR</option>
                <option value="evidence">Evidence</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
              <input
                type="text"
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="Search in logs"
              />
            </div>
            
            <div className="md:col-span-3 flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Logs table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-4 text-center">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-4 text-center">No audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(new Date(log.timestamp).getTime())}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.userRole || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resource}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <details>
                          <summary className="cursor-pointer">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {formatDetails(log.details)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Showing page {page + 1}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`px-3 py-1 border rounded ${page === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className={`px-3 py-1 border rounded ${!hasMore ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </MFAGuard>
  );
};

export default AuditLogsPage;