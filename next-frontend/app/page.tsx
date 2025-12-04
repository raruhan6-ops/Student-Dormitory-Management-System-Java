import Link from 'next/link'
import { 
  GraduationCap, 
  Building2, 
  BedDouble, 
  Shield, 
  BarChart3, 
  Users, 
  ClipboardCheck,
  Wrench,
  Mail,
  ChevronRight,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import DormitoryBuildingsSection from '@/components/DormitoryBuildingsSection'

export default function HomePage() {
  const features = [
    {
      icon: Building2,
      title: '楼栋管理',
      description: '全面管理所有宿舍楼栋、楼层和房间配置信息。',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      icon: BedDouble,
      title: '房间分配',
      description: '智能房间分配，实时查看空位，自动防止冲突。',
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      icon: ClipboardCheck,
      title: '入住/退房',
      description: '便捷的入住和退房流程，完整的历史记录追踪。',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      icon: Wrench,
      title: '报修服务',
      description: '在线提交和追踪维修请求，实时状态更新。',
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    },
    {
      icon: BarChart3,
      title: '数据分析',
      description: '实时统计入住率、学生分布和趋势分析。',
      color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    },
    {
      icon: Shield,
      title: '权限管理',
      description: '为管理员、宿管和学生提供安全的访问控制。',
      color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    },
  ]

  const stats = [
    { value: '10,000+', label: '学生管理' },
    { value: '50+', label: '宿舍楼栋' },
    { value: '99.9%', label: '系统稳定性' },
    { value: '24/7', label: '技术支持' },
  ]

  const benefits = [
    '实时房间空位查询',
    '自动邮件通知',
    '完整操作日志',
    '批量操作支持',
    '数据导出功能',
    '移动端适配',
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        
        <div className="container relative py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              高校学生宿舍管理系统
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              现代化宿舍管理
              <span className="block text-primary-200">简单高效</span>
            </h1>

            {/* Subheading */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100 sm:text-xl">
              一站式学生住宿管理平台，涵盖房间分配、设施维护等功能。
              专为追求效率的高校打造。
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary-600 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
              >
                立即开始
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                探索功能
              </Link>
            </div>
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
                  className="fill-gray-50 dark:fill-gray-900"/>
          </svg>
        </div>
      </section>

      {/* Dormitory Buildings Section */}
      <DormitoryBuildingsSection />

      {/* Stats Section */}
      <section className="border-b border-gray-100 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              学生住宿管理
              <span className="block text-primary-600 dark:text-primary-400">所需的一切功能</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              为现代高校宿舍管理设计的完整工具套件。
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-primary-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-800"
              >
                <div className={`inline-flex rounded-xl p-3 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20 dark:bg-gray-800/50">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                高效设计，
                <span className="block text-primary-600 dark:text-primary-400">灵活扩展</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                我们的平台专为处理高校住宿管理的复杂需求而设计，
                同时为所有用户提供直观的使用体验。
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-8 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center text-white">
                  <GraduationCap className="h-24 w-24 opacity-20" />
                  <div className="mt-4 text-center">
                    <div className="text-4xl font-bold">宿舍管理</div>
                    <div className="mt-2 text-primary-200">系统平台</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 sm:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              满足各类角色需求
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              为管理员、宿管和学生量身定制的使用体验。
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Admin Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
              <div className="inline-flex rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">系统管理员</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                拥有用户管理、审计日志和系统配置的完整控制权限。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 用户账户管理</li>
                <li>• 系统操作日志</li>
                <li>• 完整数据访问</li>
              </ul>
            </div>

            {/* Manager Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
              <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">宿舍管理员</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                日常运营管理，包括入住办理、申请审核和报修处理。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 房间申请审批</li>
                <li>• 入住/退房管理</li>
                <li>• 报修请求处理</li>
              </ul>
            </div>

            {/* Student Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
              <div className="inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">学生</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                自助服务门户，支持房间申请、个人资料管理和报修请求。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 申请房间</li>
                <li>• 查看分配信息</li>
                <li>• 提交报修请求</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              准备好升级您的宿舍管理系统了吗？
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              加入全国众多信赖本系统的高校，开启智能化宿舍管理。
            </p>
            <div className="mt-8">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary-600 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
              >
                登录开始使用
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">宿舍管理系统</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} 学生宿舍管理系统 版权所有
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
