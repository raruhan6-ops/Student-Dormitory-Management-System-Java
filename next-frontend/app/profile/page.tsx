"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Home, Wrench, Edit, BedDouble, Phone, Mail, Calendar, BookOpen, GraduationCap, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, Download, FileText } from 'lucide-react'
import Link from 'next/link'

type Student = {
  studentID: string
  name: string
  gender: string
  major: string
  studentClass: string
  phone: string
  enrollmentYear: number
  dormBuilding?: string
  roomNumber?: string
  bedNumber?: string
  email?: string
}

type RepairRequest = {
  repairID: number
  roomID: number
  description: string
  submitTime: string
  status: string
  handler?: string
  finishTime?: string
}

type RoomApplication = {
  applicationID: number
  status: string
  applyTime: string
  processTime: string | null
  processedBy: string | null
  rejectReason: string | null
  buildingName: string
  roomNumber: string
  bedNumber: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [repairs, setRepairs] = useState<RepairRequest[]>([])
  const [applications, setApplications] = useState<RoomApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [needsProfile, setNeedsProfile] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) {
          router.push('/auth')
          return
        }
        
        const userInfo = await meRes.json()
        setUserRole(userInfo.role)
        setUsername(userInfo.username)
        
        if (userInfo.role === 'Student' && !userInfo.relatedStudentID) {
          setNeedsProfile(true)
          setLoading(false)
          return
        }
        
        if (userInfo.role !== 'Student') {
          setLoading(false)
          return
        }

        const studentRes = await fetch(`/api/students/${userInfo.relatedStudentID}`)
        if (studentRes.ok) {
          const studentData = await studentRes.json()
          if (studentData) {
            setStudent(studentData)
            const repairsRes = await fetch(`/api/repairs/student/${studentData.studentID}`)
            if (repairsRes.ok) {
              setRepairs(await repairsRes.json())
            }
            const appsRes = await fetch('/api/student-portal/my-applications', { credentials: 'include' })
            if (appsRes.ok) {
              setApplications(await appsRes.json())
            }
          } else {
            setNeedsProfile(true)
          }
        } else {
          setNeedsProfile(true)
        }
      } catch (e) {
        // Error loading
      }
      setLoading(false)
    }
    load()
  }, [router])

  const exportToPDF = async () => {
    if (!student) return
    setExporting(true)

    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('请允许弹出窗口以导出PDF')
      setExporting(false)
      return
    }

    const dormInfo = student.dormBuilding && student.roomNumber && student.bedNumber
      ? `${student.dormBuilding} - ${student.roomNumber}室 ${student.bedNumber}号床`
      : '未分配'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>学生档案 - ${student.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Microsoft YaHei', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            color: #1f2937;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            padding-bottom: 24px; 
            border-bottom: 3px solid #3b82f6;
            margin-bottom: 32px;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #3b82f6;
            margin-bottom: 8px;
          }
          .subtitle { 
            color: #6b7280; 
            font-size: 14px;
          }
          .document-title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-top: 16px;
          }
          .section { 
            margin-bottom: 28px; 
          }
          .section-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #3b82f6;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 16px;
          }
          .info-item { 
            padding: 12px 16px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 3px solid #3b82f6;
          }
          .info-label { 
            font-size: 11px; 
            color: #6b7280; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .info-value { 
            font-size: 15px; 
            font-weight: 500;
            color: #1f2937;
          }
          .dorm-box {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #a7f3d0;
          }
          .dorm-title {
            font-size: 18px;
            font-weight: 600;
            color: #065f46;
          }
          .dorm-status {
            font-size: 13px;
            color: #047857;
            margin-top: 4px;
          }
          .no-dorm {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border: 1px solid #fcd34d;
          }
          .no-dorm .dorm-title {
            color: #92400e;
          }
          .no-dorm .dorm-status {
            color: #b45309;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          .table th, .table td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }
          .table th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          .table tr:last-child td {
            border-bottom: none;
          }
          .status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
          }
          .status-approved, .status-finished { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-rejected { background: #fee2e2; color: #991b1b; }
          .status-inprogress { background: #dbeafe; color: #1e40af; }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
          }
          .generated-date {
            margin-top: 8px;
            font-size: 11px;
          }
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏠 宿舍管理系统</div>
          <div class="subtitle">学生宿舍管理平台</div>
          <div class="document-title">学生档案</div>
        </div>

        <div class="section">
          <div class="section-title">个人信息</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">学号</div>
              <div class="info-value">${student.studentID}</div>
            </div>
            <div class="info-item">
              <div class="info-label">姓名</div>
              <div class="info-value">${student.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">性别</div>
              <div class="info-value">${student.gender === 'M' || student.gender === 'Male' ? '男' : student.gender === 'F' || student.gender === 'Female' ? '女' : student.gender}</div>
            </div>
            <div class="info-item">
              <div class="info-label">专业</div>
              <div class="info-value">${student.major}</div>
            </div>
            <div class="info-item">
              <div class="info-label">班级</div>
              <div class="info-value">${student.studentClass}</div>
            </div>
            <div class="info-item">
              <div class="info-label">入学年份</div>
              <div class="info-value">${student.enrollmentYear}</div>
            </div>
            <div class="info-item">
              <div class="info-label">电话</div>
              <div class="info-value">${student.phone || '未填写'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">邮箱</div>
              <div class="info-value">${student.email || '未填写'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">宿舍分配</div>
          <div class="dorm-box ${!student.dormBuilding ? 'no-dorm' : ''}">
            <div class="dorm-title">${dormInfo}</div>
            <div class="dorm-status">${student.dormBuilding ? '✓ 已入住' : '○ 暂未分配房间'}</div>
          </div>
        </div>

        ${applications.length > 0 ? `
        <div class="section">
          <div class="section-title">房间申请记录</div>
          <table class="table">
            <thead>
              <tr>
                <th>位置</th>
                <th>申请日期</th>
                <th>状态</th>
                <th>处理日期</th>
              </tr>
            </thead>
            <tbody>
              ${applications.map(app => `
                <tr>
                  <td>${app.buildingName} - ${app.roomNumber}室 ${app.bedNumber}号床</td>
                  <td>${new Date(app.applyTime).toLocaleDateString()}</td>
                  <td><span class="status status-${app.status.toLowerCase()}">${app.status === 'Approved' ? '已批准' : app.status === 'Pending' ? '待审核' : app.status === 'Rejected' ? '已拒绝' : app.status}</span></td>
                  <td>${app.processTime ? new Date(app.processTime).toLocaleDateString() : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${repairs.length > 0 ? `
        <div class="section">
          <div class="section-title">报修记录</div>
          <table class="table">
            <thead>
              <tr>
                <th>房间</th>
                <th>问题描述</th>
                <th>提交日期</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              ${repairs.map(r => `
                <tr>
                  <td>${r.roomID}号房</td>
                  <td>${r.description}</td>
                  <td>${new Date(r.submitTime).toLocaleDateString()}</td>
                  <td><span class="status status-${r.status.toLowerCase()}">${r.status === 'Pending' ? '待处理' : r.status === 'InProgress' ? '处理中' : r.status === 'Finished' ? '已完成' : r.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <div>本文档由学生宿舍管理系统生成</div>
          <div class="generated-date">生成时间：${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        setExporting(false)
      }, 250)
    }
  }

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载资料...</p>
        </div>
      </div>
    )
  }
  
  if (userRole && userRole !== 'Student') {
    return (
      <div className="container-section">
        <div className="mx-auto max-w-md text-center">
          <div className="card p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <User className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">管理员账户</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              当前登录：<strong>{username}</strong>
            </p>
            <span className="badge-primary mt-3">{userRole === 'Admin' ? '系统管理员' : '宿舍管理员'}</span>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              此页面仅供学生账户使用。
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (needsProfile) {
    return (
      <div className="container-section">
        <div className="mx-auto max-w-md">
          <div className="card bg-gradient-to-br from-primary-50 to-white p-8 text-center dark:from-primary-900/20 dark:to-gray-800">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">欢迎使用宿舍管理系统！</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              请完善您的学生资料以使用宿舍服务并申请房间。
            </p>
            <button
              onClick={() => router.push('/profile/setup')}
              className="btn-primary mt-6 w-full"
            >
              <User className="h-4 w-4" />
              创建个人资料
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">暂无资料数据。</p>
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
              <User className="h-5 w-5" />
            </div>
            我的资料
          </h1>
          <p className="page-description mt-1">
            查看和管理您的学生信息
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToPDF} 
            disabled={exporting}
            className="btn-secondary"
          >
            {exporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                导出PDF
              </>
            )}
          </button>
          <Link href="/profile/setup" className="btn-secondary">
            <Edit className="h-4 w-4" />
            编辑资料
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Personal Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                个人信息
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={<BookOpen className="h-4 w-4" />} label="学号" value={student.studentID} />
              <InfoItem icon={<User className="h-4 w-4" />} label="姓名" value={student.name} />
              <InfoItem 
                icon={<User className="h-4 w-4" />} 
                label="性别" 
                value={student.gender === 'M' || student.gender === 'Male' ? '男' : student.gender === 'F' || student.gender === 'Female' ? '女' : student.gender} 
              />
              <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="专业" value={student.major} />
              <InfoItem icon={<BookOpen className="h-4 w-4" />} label="班级" value={student.studentClass} />
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="入学年份" value={student.enrollmentYear.toString()} />
              <InfoItem icon={<Phone className="h-4 w-4" />} label="电话" value={student.phone || '未填写'} />
              <InfoItem icon={<Mail className="h-4 w-4" />} label="邮箱" value={student.email || '未填写'} />
            </div>
          </div>

          {/* Room Applications Card */}
          {applications.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  房间申请记录
                </h3>
                <span className="badge-info">共 {applications.length} 条</span>
              </div>
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.applicationID} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {app.buildingName} - {app.roomNumber}室 {app.bedNumber}号床
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          申请时间：{new Date(app.applyTime).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    {app.processTime && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        处理时间：{new Date(app.processTime).toLocaleDateString()} 处理人：{app.processedBy}
                      </p>
                    )}
                    {app.rejectReason && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        <strong>拒绝原因：</strong> {app.rejectReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repair Requests Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                我的报修记录
              </h3>
              <span className="badge-info">共 {repairs.length} 条</span>
            </div>
            {repairs.length === 0 ? (
              <div className="empty-state py-8">
                <Wrench className="empty-state-icon" />
                <p className="empty-state-title">暂无报修记录</p>
                <p className="empty-state-description">您还没有提交过报修请求。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {repairs.map((r) => (
                  <div key={r.repairID} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{r.roomID}号房</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{r.description}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          提交时间：{new Date(r.submitTime).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Dorm Info */}
        <div className="space-y-6">
          {/* Current Dorm Assignment */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Home className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                宿舍分配
              </h3>
            </div>
            {student.dormBuilding && student.roomNumber && student.bedNumber ? (
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 dark:from-emerald-900/30 dark:to-emerald-800/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{student.dormBuilding}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {student.roomNumber}室 • {student.bedNumber}号床
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle className="h-4 w-4" />
                  <span>已入住</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.some(a => a.status === 'Pending') ? (
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:from-blue-900/30 dark:to-blue-800/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-800 dark:text-blue-300">申请审核中</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">等待管理员审批</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 dark:from-amber-900/30 dark:to-amber-800/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white">
                        <BedDouble className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-300">暂未分配房间</p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">申请房间以开始入住</p>
                      </div>
                    </div>
                    <Link href="/apply-room" className="btn-primary mt-4 w-full">
                      <BedDouble className="h-4 w-4" />
                      申请房间
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">快捷操作</h3>
            </div>
            <div className="space-y-2">
              <button 
                onClick={exportToPDF} 
                disabled={exporting}
                className="btn-primary w-full justify-start"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    正在生成PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    导出个人档案PDF
                  </>
                )}
              </button>
              <Link href="/apply-room" className="btn-secondary w-full justify-start">
                <BedDouble className="h-4 w-4" />
                申请房间
              </Link>
              <Link href="/repairs" className="btn-secondary w-full justify-start">
                <Wrench className="h-4 w-4" />
                提交报修
              </Link>
              <Link href="/profile/setup" className="btn-secondary w-full justify-start">
                <Edit className="h-4 w-4" />
                更新资料
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = () => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'finished':
        return 'badge-success'
      case 'pending':
        return 'badge-warning'
      case 'rejected':
        return 'badge-danger'
      case 'inprogress':
        return 'badge-info'
      default:
        return 'badge-primary'
    }
  }

  const getIcon = () => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'finished':
        return <CheckCircle className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'rejected':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <span className={`${getStatusStyle()} flex items-center gap-1`}>
      {getIcon()}
      {status}
    </span>
  )
}
