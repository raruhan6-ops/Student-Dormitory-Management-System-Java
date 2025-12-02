'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, RefreshCw, CheckCircle, XCircle, Clock, User, BedDouble, Building2, Calendar, AlertTriangle, X, ArrowLeft, FileX } from 'lucide-react';

interface RoomApplication {
  applicationID: number;
  studentID: string;
  studentName: string;
  major: string;
  gender: string;
  status: string;
  applyTime: string;
  processTime: string | null;
  processedBy: string | null;
  rejectReason: string | null;
  buildingName: string;
  roomNumber: string;
  bedNumber: string;
  bedStatus: string;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<RoomApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ show: boolean; appId: number | null; reason: string }>({
    show: false,
    appId: null,
    reason: ''
  });

  const fetchApplications = async () => {
    try {
      const url = filterStatus 
        ? `/api/applications?status=${filterStatus}` 
        : '/api/applications';
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) {
        router.push('/auth');
        return;
      }
      if (res.status === 403) {
        router.push('/dashboard');
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch applications');
      }
      const data = await res.json();
      setApplications(data);
      setError('');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const handleApprove = async (appId: number) => {
    if (!confirm('Are you sure you want to approve this application? The student will be checked in immediately.')) {
      return;
    }

    setProcessing(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      
      // Handle concurrent booking conflict
      if (res.status === 409) {
        const errorMsg = data.error || 'This bed has already been assigned to another student.';
        alert(`⚠️ Concurrent Booking Conflict\n\n${errorMsg}\n\nThe application list will be refreshed.`);
        fetchApplications();
        return;
      }
      
      if (!res.ok) throw new Error(data.error || data.message || data || 'Failed to approve');
      alert(`✅ ${data.message}`);
      fetchApplications();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.appId) return;

    setProcessing(rejectModal.appId);
    try {
      const res = await fetch(`/api/applications/${rejectModal.appId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectModal.reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data || 'Failed to reject');
      alert('Application rejected');
      setRejectModal({ show: false, appId: null, reason: '' });
      fetchApplications();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="badge-warning flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'Approved':
        return (
          <span className="badge-success flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="badge-danger flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return <span className="badge-primary">{status}</span>;
    }
  };

  // Count applications by status
  const pendingCount = applications.filter(a => a.status === 'Pending').length;

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-section">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <FileCheck className="h-5 w-5" />
            </div>
            Room Applications
          </h1>
          <p className="page-description mt-1">
            Review and process student room applications
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{pendingCount}</p>
            <p className="stat-label">Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{applications.filter(a => a.status === 'Approved').length || '-'}</p>
            <p className="stat-label">Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{applications.filter(a => a.status === 'Rejected').length || '-'}</p>
            <p className="stat-label">Rejected</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{applications.length}</p>
            <p className="stat-label">Total</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="tabs">
          {[
            { value: 'Pending', label: 'Pending', icon: Clock },
            { value: 'Approved', label: 'Approved', icon: CheckCircle },
            { value: 'Rejected', label: 'Rejected', icon: XCircle },
            { value: '', label: 'All', icon: FileCheck },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`tab ${filterStatus === tab.value ? 'tab-active' : ''}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.value === 'Pending' && pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Applications Table/Cards */}
      {applications.length === 0 ? (
        <div className="card">
          <div className="empty-state py-12">
            <FileX className="empty-state-icon" />
            <p className="empty-state-title">No {filterStatus ? filterStatus.toLowerCase() : ''} applications</p>
            <p className="empty-state-description">Applications matching your filter will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Student</th>
                  <th className="table-header-cell">Room Request</th>
                  <th className="table-header-cell">Applied</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {applications.map((app) => (
                  <tr key={app.applicationID} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{app.studentName}</p>
                          <p className="text-sm text-gray-500">{app.studentID}</p>
                          <p className="text-xs text-gray-400">{app.major} • {app.gender === 'M' ? 'Male' : 'Female'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{app.buildingName}</p>
                          <p className="text-sm text-gray-500">Room {app.roomNumber}, Bed {app.bedNumber}</p>
                          {app.bedStatus !== 'Available' && app.status === 'Pending' && (
                            <span className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              Bed no longer available
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(app.applyTime)}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        {getStatusBadge(app.status)}
                        {app.status !== 'Pending' && (
                          <p className="text-xs text-gray-400">
                            by {app.processedBy}
                            <br />
                            {formatDateTime(app.processTime)}
                          </p>
                        )}
                        {app.rejectReason && (
                          <p className="text-xs text-red-600" title={app.rejectReason}>
                            {app.rejectReason.length > 30 
                              ? `${app.rejectReason.substring(0, 30)}...` 
                              : app.rejectReason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      {app.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(app.applicationID)}
                            disabled={processing === app.applicationID || app.bedStatus !== 'Available'}
                            className="btn-primary py-1.5 text-sm"
                          >
                            {processing === app.applicationID ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setRejectModal({ show: true, appId: app.applicationID, reason: '' })}
                            disabled={processing === app.applicationID}
                            className="btn-ghost py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Reject Application
              </h3>
              <button 
                onClick={() => setRejectModal({ show: false, appId: null, reason: '' })} 
                className="modal-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="modal-body">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Please provide a reason for rejecting this application (optional):
              </p>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="e.g., Room is reserved for another department..."
                className="input h-24 resize-none"
              />
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setRejectModal({ show: false, appId: null, reason: '' })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing !== null}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                {processing !== null ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Reject Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
