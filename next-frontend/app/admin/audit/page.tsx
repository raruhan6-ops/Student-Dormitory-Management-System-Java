"use client"

import { useEffect, useState } from 'react'
import { FileText, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

type AuditLog = {
  id: number
  action: string
  entityType: string
  entityId: string
  details: string
  performedBy: string
  timestamp: string
  ipAddress?: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)

  // Filters
  const [filterEntity, setFilterEntity] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterUser, setFilterUser] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      let url = `/api/audit?page=${page}&size=${pageSize}`
      
      // Apply filters
      if (filterEntity) {
        url = `/api/audit/entity/${encodeURIComponent(filterEntity)}`
      } else if (filterAction) {
        url = `/api/audit/action/${encodeURIComponent(filterAction)}`
      } else if (filterUser) {
        url = `/api/audit/user/${encodeURIComponent(filterUser)}`
      }

      const res = await fetch(url)
      const data = await res.json()
      
      if (Array.isArray(data)) {
        setLogs(data)
        setTotal(data.length)
      } else {
        setLogs(data.items || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error('加载审计日志失败:', e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filterEntity, filterAction, filterUser])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const actionLabel = (action: string) => {
    switch (action) {
      case 'CREATE': return '创建'
      case 'UPDATE': return '更新'
      case 'DELETE': return '删除'
      case 'CHECK_IN': return '入住'
      case 'CHECK_OUT': return '退住'
      case 'LOGIN': return '登录'
      default: return action
    }
  }

  const actionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'CHECK_IN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'CHECK_OUT': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'LOGIN': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const clearFilters = () => {
    setFilterEntity('')
    setFilterAction('')
    setFilterUser('')
    setPage(1)
  }

  return (
    <section className="container-section space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={24} className="text-blue-600" />
          <h2 className="text-2xl font-semibold">审计日志</h2>
        </div>
        <span className="text-sm text-gray-500">{total} 条记录</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
        <Filter size={16} className="text-gray-500" />
        <input
          placeholder="按实体类型筛选…"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          value={filterEntity}
          onChange={(e) => { setFilterEntity(e.target.value); setFilterAction(''); setFilterUser(''); setPage(1) }}
        />
        <input
          placeholder="按操作筛选…"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setFilterEntity(''); setFilterUser(''); setPage(1) }}
        />
        <input
          placeholder="按用户筛选…"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          value={filterUser}
          onChange={(e) => { setFilterUser(e.target.value); setFilterEntity(''); setFilterAction(''); setPage(1) }}
        />
        {(filterEntity || filterAction || filterUser) && (
          <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">清除</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p>加载中…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold">时间</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold">操作</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold">实体</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold">详情</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold">操作人</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${actionColor(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">{log.entityType}</td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-600 dark:text-gray-400">{log.entityId}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-xs text-gray-600 dark:text-gray-400" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-4 py-2 text-sm">{log.performedBy}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      未找到审计日志。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!filterEntity && !filterAction && !filterUser && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
              >
                <ChevronLeft size={16} /> 上一页
              </button>
              <span className="text-sm text-gray-500">第 {page} 页 / 共 {totalPages} 页</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
              >
                下一页 <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
