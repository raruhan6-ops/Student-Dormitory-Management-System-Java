'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, RefreshCw, CheckCircle, XCircle, Clock, User, BedDouble, Building2, Calendar, AlertTriangle, X, ArrowLeft, FileX, Search, Sparkles } from 'lucide-react';
import Fuse from 'fuse.js';

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

// Fuse.js configuration for fuzzy search
const fuseOptions: Fuse.IFuseOptions<RoomApplication> = {
  keys: [
    { name: 'studentID', weight: 0.3 },
    { name: 'studentName', weight: 0.3 },
    { name: 'major', weight: 0.2 },
    { name: 'buildingName', weight: 0.1 },
    { name: 'roomNumber', weight: 0.1 },
  ],
  threshold: 0.4,
  distance: 100,
  includeScore: true,
  minMatchCharLength: 1,
  ignoreLocation: true,
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<RoomApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [processing, setProcessing] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [useFuzzy, setUseFuzzy] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ show: boolean; appId: number | null; reason: string }>({
    show: false,
    appId: null,
    reason: ''
  });

  // Create Fuse instance
  const fuse = useMemo(() => new Fuse(applications, fuseOptions), [applications]);

  // Filtered applications with fuzzy search
  const filteredApplications = useMemo(() => {
    if (!search.trim()) return applications;

    if (useFuzzy) {
      return fuse.search(search).map(r => r.item);
    } else {
      const q = search.toLowerCase();
      return applications.filter(a =>
        a.studentID?.toLowerCase().includes(q) ||
        a.studentName?.toLowerCase().includes(q) ||
        a.major?.toLowerCase().includes(q) ||
        a.buildingName?.toLowerCase().includes(q) ||
        a.roomNumber?.toLowerCase().includes(q)
      );
    }
  }, [applications, search, fuse, useFuzzy]);

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
    if (!confirm('确定要批准此申请吗？学生将立即办理入住。')) {
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
        const errorMsg = data.error || '该床位已被分配给其他学生。';
        alert(`⚠️ 并发冲突\n\n${errorMsg}\n\n申请列表将会刷新。`);
        fetchApplications();
        return;
      }
      
      if (!res.ok) throw new Error(data.error || data.message || data || '批准失败');
      alert(`✅ ${data.message || '申请已批准'}`);
      fetchApplications();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`错误：${error.message}`);
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
      if (!res.ok) throw new Error(data.message || data || '拒绝失败');
      alert('申请已拒绝');
      setRejectModal({ show: false, appId: null, reason: '' });
      fetchApplications();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`错误：${error.message}`);
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
            待审核
          </span>
        );
      case 'Approved':
        return (
          <span className="badge-success flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            已批准
          </span>
        );
      case 'Rejected':
        return (
          <span className="badge-danger flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            已拒绝
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载申请列表...</p>
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
            房间申请审批
          </h1>
          <p className="page-description mt-1">
            审核和处理学生的房间申请
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          返回控制台
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
            <p className="stat-label">待审核</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{applications.filter(a => a.status === 'Approved').length || '-'}</p>
            <p className="stat-label">已批准</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{applications.filter(a => a.status === 'Rejected').length || '-'}</p>
            <p className="stat-label">已拒绝</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{applications.length}</p>
            <p className="stat-label">总计</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="tabs">
          {[
            { value: 'Pending', label: '待审核', icon: Clock },
            { value: 'Approved', label: '已批准', icon: CheckCircle },
            { value: 'Rejected', label: '已拒绝', icon: XCircle },
            { value: '', label: '全部', icon: FileCheck },
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

        {/* Search Box with Fuzzy Toggle */}
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={useFuzzy ? "模糊搜索学号、姓名..." : "精确搜索学号、姓名..."}
            className="input h-9 pl-9 pr-20 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setUseFuzzy(!useFuzzy)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-all ${
              useFuzzy 
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
            title={useFuzzy ? '切换到精确搜索' : '切换到模糊搜索'}
          >
            <Sparkles className={`h-3 w-3 ${useFuzzy ? 'text-primary-500' : ''}`} />
            {useFuzzy ? '模糊' : '精确'}
          </button>
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
      {filteredApplications.length === 0 ? (
        <div className="card">
          <div className="empty-state py-12">
            <FileX className="empty-state-icon" />
            <p className="empty-state-title">
              {search ? '未找到匹配的申请' : `暂无${filterStatus === 'Pending' ? '待审核' : filterStatus === 'Approved' ? '已批准' : filterStatus === 'Rejected' ? '已拒绝' : ''}申请`}
            </p>
            <p className="empty-state-description">
              {search ? '请尝试其他搜索条件' : '符合筛选条件的申请将显示在此处。'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {search && (
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              找到 {filteredApplications.length} 条匹配结果
              {useFuzzy && <span className="ml-2 text-primary-600 dark:text-primary-400">✨ 智能模糊匹配</span>}
            </div>
          )}
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">学生</th>
                  <th className="table-header-cell">申请房间</th>
                  <th className="table-header-cell">申请时间</th>
                  <th className="table-header-cell">状态</th>
                  <th className="table-header-cell text-right">操作</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredApplications.map((app) => (
                  <tr key={app.applicationID} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{app.studentName}</p>
                          <p className="text-sm text-gray-500">{app.studentID}</p>
                          <p className="text-xs text-gray-400">{app.major} • {app.gender === 'Male' || app.gender === 'M' ? '男' : '女'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{app.buildingName}</p>
                          <p className="text-sm text-gray-500">{app.roomNumber}室 {app.bedNumber}号床</p>
                          {/* Only show warning if bed is Occupied (not Reserved - Reserved means it's held for this application) */}
                          {app.bedStatus === 'Occupied' && app.status === 'Pending' && (
                            <span className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              床位已被占用
                            </span>
                          )}
                          {app.bedStatus === 'Reserved' && app.status === 'Pending' && (
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <BedDouble className="h-3 w-3" />
                              已为此申请预留
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
                            处理人：{app.processedBy}
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
                            disabled={processing === app.applicationID || app.bedStatus === 'Occupied'}
                            className="btn-primary py-1.5 text-sm"
                          >
                            {processing === app.applicationID ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                批准
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setRejectModal({ show: true, appId: app.applicationID, reason: '' })}
                            disabled={processing === app.applicationID}
                            className="btn-ghost py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <XCircle className="h-4 w-4" />
                            拒绝
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
                拒绝申请
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
                请填写拒绝此申请的原因（可选）：
              </p>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="例如：该房间已预留给其他院系..."
                className="input h-24 resize-none"
              />
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setRejectModal({ show: false, appId: null, reason: '' })}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={processing !== null}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                {processing !== null ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    确认拒绝
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
