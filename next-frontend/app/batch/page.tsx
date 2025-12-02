"use client"

import { useState } from 'react'
import { Upload, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

export default function BatchPage() {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const [deleteIds, setDeleteIds] = useState('')
  const [deleteResult, setDeleteResult] = useState<{ deleted: number; notFound: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    try {
      const res = await fetch('/api/batch/students/export')
      if (!res.ok) throw new Error('导出失败')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_export.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (e: any) {
      alert(e?.message || '导出失败')
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setLoading(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const res = await fetch('/api/batch/students/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setImportResult(data)
      setImportFile(null)
    } catch (e: any) {
      setImportResult({ imported: 0, errors: [e?.message || '导入失败'] })
    }
    setLoading(false)
  }

  const handleBatchDelete = async () => {
    if (!deleteIds.trim()) return
    if (!confirm('确定要删除这些学生吗？')) return
    setLoading(true)
    setDeleteResult(null)

    try {
      const ids = deleteIds.split(/[\n,]/).map(id => id.trim()).filter(Boolean)
      
      const res = await fetch('/api/batch/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      })

      const data = await res.json()
      setDeleteResult(data)
      if (data.deleted > 0) setDeleteIds('')
    } catch (e: any) {
      setDeleteResult({ deleted: 0, notFound: 0, errors: [e?.message || '删除失败'] })
    }
    setLoading(false)
  }

  return (
    <section className="container-section space-y-6">
      <h2 className="text-2xl font-semibold">批量操作</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <Download className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold">导出学生数据</h3>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            将所有学生记录下载为CSV文件。
          </p>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <Download size={16} /> 导出CSV
          </button>
        </div>

        {/* Import Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <Upload className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold">导入学生数据</h3>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            上传CSV文件以添加或更新学生。格式：学号、姓名、性别、专业、班级、入学年份、电话、邮箱
          </p>
          
          <div className="mb-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          
          <button
            onClick={handleImport}
            disabled={!importFile || loading}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Upload size={16} /> {loading ? '导入中…' : '导入CSV'}
          </button>

          {importResult && (
            <div className={`mt-4 rounded-md p-3 ${importResult.errors.length === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
              <div className="flex items-center gap-2 text-sm">
                {importResult.errors.length === 0 ? (
                  <CheckCircle className="text-green-600" size={16} />
                ) : (
                  <AlertCircle className="text-yellow-600" size={16} />
                )}
                <span>已导入 {importResult.imported} 名学生</span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto text-xs text-gray-600 dark:text-gray-400">
                  {importResult.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batch Delete Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 className="text-red-600" size={24} />
          <h3 className="text-lg font-semibold">批量删除学生</h3>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          输入要删除的学号（每行一个或用逗号分隔）。
        </p>
        
        <textarea
          rows={5}
          placeholder="20250001&#10;20250002&#10;20250003"
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800"
          value={deleteIds}
          onChange={(e) => setDeleteIds(e.target.value)}
        />
        
        <button
          onClick={handleBatchDelete}
          disabled={!deleteIds.trim() || loading}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 size={16} /> {loading ? '删除中…' : '删除学生'}
        </button>

        {deleteResult && (
          <div className={`mt-4 rounded-md p-3 ${deleteResult.errors.length === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
            <p className="text-sm">
              已删除：{deleteResult.deleted} • 未找到：{deleteResult.notFound}
            </p>
            {deleteResult.errors.length > 0 && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {deleteResult.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSV Template */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">CSV模板</h3>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          导入学生时请使用以下格式：
        </p>
        <pre className="overflow-x-auto rounded-md bg-gray-100 p-3 text-xs dark:bg-gray-800">
{`学号,姓名,性别,专业,班级,入学年份,电话,邮箱
20250001,张三,男,计算机科学,计科2025,2025,13800138001,zhangsan@example.com
20250002,李四,女,数学,数学2024,2024,13800138002,lisi@example.com`}
        </pre>
      </div>
    </section>
  )
}
