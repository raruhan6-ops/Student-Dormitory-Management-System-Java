import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { cookies } from 'next/headers'
import LogoutButton from './LogoutButton'
import { verifyAndDecodeToken } from '@/lib/auth'
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  Building2, 
  ClipboardCheck, 
  FileStack,
  Wrench,
  UserCog,
  ClipboardList,
  User,
  BedDouble,
  Bell,
  Menu,
  Flame
} from 'lucide-react'

export default function Navbar() {
  const raw = cookies().get('auth')?.value
  const secret = process.env.AUTH_SECRET || 'change-me'
  const payload = verifyAndDecodeToken(raw, secret)
  const username = payload?.username ?? null
  const role = payload?.role ?? null

  const isAdmin = role === 'Admin'
  const isManager = role === 'DormManager'
  const isStudent = role === 'Student'
  const isStaff = isAdmin || isManager

  const staffLinks = [
    { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
    { href: '/heatmap', label: '入住热力图', icon: Flame },
    { href: '/students', label: '学生管理', icon: Users },
    { href: '/buildings', label: '楼栋管理', icon: Building2 },
    { href: '/checkin', label: '入住办理', icon: ClipboardCheck },
    { href: '/applications', label: '申请审核', icon: FileStack },
    { href: '/batch', label: '批量操作', icon: ClipboardList },
    { href: '/repairs', label: '报修管理', icon: Wrench },
  ]

  const adminLinks = [
    { href: '/admin/users', label: '用户管理', icon: UserCog },
    { href: '/admin/audit', label: '操作日志', icon: ClipboardList },
  ]

  const studentLinks = [
    { href: '/profile', label: '我的资料', icon: User },
    { href: '/apply-room', label: '申请房间', icon: BedDouble },
    { href: '/repairs', label: '报修服务', icon: Wrench },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-900/95">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">宿舍管理</span>
            <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">系统</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {username && (
            <>
              {/* Staff Navigation */}
              {isStaff && staffLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link flex items-center gap-1.5"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Admin-only Links */}
              {isAdmin && adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link flex items-center gap-1.5"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Student Navigation */}
              {isStudent && studentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link flex items-center gap-1.5"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {username ? (
            <>
              {/* User Info */}
              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {role === 'Admin' ? '系统管理员' : role === 'DormManager' ? '宿舍管理员' : '学生'}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <User className="h-4 w-4" />
                </div>
              </div>
              <LogoutButton />
            </>
          ) : (
            <Link 
              href="/auth" 
              className="btn-primary"
            >
              登录
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation */}
      {username && (
        <div className="flex overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden dark:border-gray-800">
          <div className="flex gap-1">
            {isStaff && staffLinks.slice(0, 4).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
            {isStudent && studentLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
