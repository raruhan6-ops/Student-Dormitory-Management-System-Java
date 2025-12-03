"use client"

import { useEffect, useState, useMemo } from 'react'
import { Plus, Wrench, CheckCircle, Clock, X, DoorOpen, User, Calendar, RefreshCw, Settings, AlertCircle, Search, Sparkles, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import Fuse from 'fuse.js'

type RepairRequest = {
  repairID: number
  roomID: number
  submitterStudentID: string
  description: string
  submitTime: string
  status: string
  handler?: string
  finishTime?: string
}

type UserInfo = {
  username: string
  role: string
  studentId?: string
}

// Fuse.js configuration for fuzzy search
const fuseOptions: Fuse.IFuseOptions<RepairRequest> = {
  keys: [
    { name: 'description', weight: 0.4 },
    { name: 'submitterStudentID', weight: 0.3 },
    { name: 'handler', weight: 0.2 },
    { name: 'roomID', weight: 0.1 },
  ],
  threshold: 0.4,
  distance: 100,
  includeScore: true,
  minMatchCharLength: 1,
  ignoreLocation: true,
}

export default function RepairsPage() {
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'Pending' | 'InProgress' | 'Finished'>('all')
  const [search, setSearch] = useState('')
  const [useFuzzy, setUseFuzzy] = useState(true)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isManager, setIsManager] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ roomID: '', submitterStudentID: '', description: '' })
  const [saving, setSaving] = useState(false)

  // Handler modal
  const [handlerModal, setHandlerModal] = useState<RepairRequest | null>(null)
  const [handlerForm, setHandlerForm] = useState({ handler: '', status: 'InProgress' })
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  // Get current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUserInfo(data)
          setIsManager(data.role === 'Admin' || data.role === 'DormManager')
          // Pre-fill student ID for students
          if (data.role === 'Student' && data.studentId) {
            setForm(prev => ({ ...prev, submitterStudentID: data.studentId }))
          }
        }
      } catch { /* ignore */ }
    }
    fetchUserInfo()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      let endpoint = '/api/repairs'
      
      // Students can only see their own repairs
      if (userInfo && userInfo.role === 'Student' && userInfo.studentId) {
        endpoint = `/api/repairs/student/${userInfo.studentId}`
      }
      
      const res = await fetch(endpoint, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        // Ensure we always have an array
        setRequests(Array.isArray(data) ? data : [])
      } else {
        // If unauthorized or error, set empty array
        setRequests([])
      }
    } catch { 
      setRequests([])
    }
    setLoading(false)
  }

  useEffect(() => { 
    if (userInfo !== null) {
      load() 
    }
  }, [userInfo])

  // Create Fuse instance
  const fuse = useMemo(() => new Fuse(requests, fuseOptions), [requests])

  // Filter by status first, then search
  const filtered = useMemo(() => {
    let result = filter === 'all' ? requests : requests.filter((r) => r.status === filter)
    
    if (!search.trim()) return result

    if (useFuzzy) {
      const fuseFiltered = new Fuse(result, fuseOptions)
      return fuseFiltered.search(search).map(r => r.item)
    } else {
      const q = search.toLowerCase()
      return result.filter(r => 
        r.description?.toLowerCase().includes(q) ||
        r.submitterStudentID?.toLowerCase().includes(q) ||
        r.handler?.toLowerCase().includes(q) ||
        String(r.roomID).includes(q)
      )
    }
  }, [requests, filter, search, useFuzzy])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Use the student's ID from userInfo if available
      const submitterId = userInfo?.studentId || form.submitterStudentID
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          roomID: Number(form.roomID),
          submitterStudentID: submitterId,
          description: form.description 
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setModalOpen(false)
      setForm({ roomID: '', submitterStudentID: userInfo?.studentId || '', description: '' })
      load()
    } catch {
      alert('提交报修请求出错')
    }
    setSaving(false)
  }

  const handleUpdateStatus = async () => {
    if (!handlerModal) return
    try {
      const res = await fetch(`/api/repairs/${handlerModal.repairID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handlerForm),
      })
      if (!res.ok) throw new Error('Failed')
      setHandlerModal(null)
      load()
    } catch {
      alert('更新出错')
    }
  }

  // Export functions
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExportMenuOpen(false)
    try {
      let endpoint = '/api/manager/export/repairs'
      let filename = 'repairs'
      
      switch (format) {
        case 'excel':
          endpoint = '/api/manager/export/repairs/excel'
          filename = 'repairs.xlsx'
          break
        case 'pdf':
          endpoint = '/api/manager/export/repairs/pdf'
          filename = 'repairs.pdf'
          break
        default:
          filename = 'repairs.csv'
      }
      
      const res = await fetch(endpoint, { credentials: 'include' })
      if (!res.ok) throw new Error('导出失败')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e: any) {
      alert(e?.message || '导出失败')
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Finished':
        return { icon: CheckCircle, color: 'emerald', badge: 'badge-success' }
      case 'InProgress':
        return { icon: Settings, color: 'amber', badge: 'badge-warning' }
      default:
        return { icon: Clock, color: 'gray', badge: 'badge-primary' }
    }
  }

  // Stats
  const pendingCount = requests.filter(r => r.status === 'Pending').length
  const inProgressCount = requests.filter(r => r.status === 'InProgress').length
  const finishedCount = requests.filter(r => r.status === 'Finished').length

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载报修请求...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-section">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Wrench className="h-5 w-5" />
            </div>
            报修管理
          </h1>
          <p className="page-description mt-1">
            提交和跟踪宿舍设施维修请求
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Dropdown - Only for managers */}
          {isManager && (
            <div className="relative">
              <button 
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="btn-secondary"
              >
                <Download className="h-4 w-4" />
                导出
                <ChevronDown className={`h-4 w-4 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {exportMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <button
                      onClick={() => handleExport('csv')}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FileText className="h-4 w-4 text-gray-500" />
                      导出 CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      导出 Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FileText className="h-4 w-4 text-red-600" />
                      导出 PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            新建报修
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="stat-icon bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{pendingCount}</p>
            <p className="stat-label">待处理</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{inProgressCount}</p>
            <p className="stat-label">处理中</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{finishedCount}</p>
            <p className="stat-label">已完成</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{requests.length}</p>
            <p className="stat-label">总计</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="tabs">
          {([
            { value: 'all', label: '全部', count: requests.length },
            { value: 'Pending', label: '待处理', count: pendingCount },
            { value: 'InProgress', label: '处理中', count: inProgressCount },
            { value: 'Finished', label: '已完成', count: finishedCount },
          ] as const).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`tab ${filter === f.value ? 'tab-active' : ''}`}
            >
              {f.label}
              {f.count > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Search Box */}
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={useFuzzy ? "模糊搜索描述、学号..." : "精确搜索描述、学号..."}
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

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state py-12">
            <Wrench className="empty-state-icon" />
            <p className="empty-state-title">暂无报修请求</p>
            <p className="empty-state-description">
              {filter === 'all' 
                ? '提交新的报修请求以开始使用。' 
                : `没有${filter === 'Pending' ? '待处理' : filter === 'InProgress' ? '处理中' : '已完成'}的请求。`}
            </p>
            {filter === 'all' && (
              <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">
                <Plus className="h-4 w-4" />
                新建报修
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const config = getStatusConfig(r.status)
            const StatusIcon = config.icon
            
            return (
              <div key={r.repairID} className="card p-0 overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-${config.color}-100 text-${config.color}-600 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`}>
                    <StatusIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                            <DoorOpen className="h-4 w-4 text-gray-400" />
                            {r.roomID}号房间
                          </span>
                          <span className={config.badge}>{r.status === 'InProgress' ? '处理中' : r.status === 'Pending' ? '待处理' : '已完成'}</span>
                        </div>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">{r.description}</p>
                      </div>
                      
                      {r.status !== 'Finished' && isManager && (
                        <button
                          onClick={() => { 
                            setHandlerModal(r)
                            setHandlerForm({ handler: r.handler || '', status: r.status === 'Pending' ? 'InProgress' : 'Finished' }) 
                          }}
                          className="btn-secondary shrink-0 text-sm"
                        >
                          <Settings className="h-4 w-4" />
                          更新
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {r.submitterStudentID}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(r.submitTime).toLocaleDateString()}
                      </span>
                      {r.handler && (
                        <span className="flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5" />
                          处理人：{r.handler}
                        </span>
                      )}
                      {r.finishTime && (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          完成时间：{new Date(r.finishTime).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Request Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary-600" />
                新建报修请求
              </h3>
              <button onClick={() => setModalOpen(false)} className="modal-close">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="modal-body space-y-4">
              <div>
                <label className="input-label flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5" />
                  房间ID
                </label>
                <input 
                  placeholder="例如：101" 
                  type="number" 
                  className="input" 
                  value={form.roomID} 
                  onChange={(e) => setForm({ ...form, roomID: e.target.value })} 
                />
              </div>
              <div>
                <label className="input-label flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  您的学号
                </label>
                <input 
                  placeholder="例如：20250001" 
                  className="input" 
                  value={form.submitterStudentID} 
                  onChange={(e) => setForm({ ...form, submitterStudentID: e.target.value })}
                  readOnly={!!userInfo?.studentId}
                  disabled={!!userInfo?.studentId}
                />
                {userInfo?.studentId && (
                  <p className="mt-1 text-xs text-gray-500">学号已自动填入</p>
                )}
              </div>
              <div>
                <label className="input-label flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  问题描述
                </label>
                <textarea 
                  placeholder="请详细描述问题..." 
                  rows={4} 
                  className="input resize-none" 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">取消</button>
              <button onClick={handleSubmit} disabled={saving || !form.roomID || !form.description} className="btn-primary">
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    提交请求
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handler Modal */}
      {handlerModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary-600" />
                更新请求
              </h3>
              <button onClick={() => setHandlerModal(null)} className="modal-close">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="modal-body space-y-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">{handlerModal.roomID}号房间</p>
                <p className="mt-1 text-gray-900 dark:text-white">{handlerModal.description}</p>
              </div>
              
              <div>
                <label className="input-label">处理人姓名</label>
                <input 
                  placeholder="输入处理人姓名" 
                  className="input" 
                  value={handlerForm.handler} 
                  onChange={(e) => setHandlerForm({ ...handlerForm, handler: e.target.value })} 
                />
              </div>
              <div>
                <label className="input-label">状态</label>
                <select 
                  className="input" 
                  value={handlerForm.status} 
                  onChange={(e) => setHandlerForm({ ...handlerForm, status: e.target.value })}
                >
                  <option value="InProgress">处理中</option>
                  <option value="Finished">已完成</option>
                </select>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setHandlerModal(null)} className="btn-secondary">取消</button>
              <button onClick={handleUpdateStatus} className="btn-primary">
                <CheckCircle className="h-4 w-4" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
