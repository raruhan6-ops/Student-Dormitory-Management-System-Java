export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="container-section">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Student Dormitory Management System
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Manage occupancy, bookings, and student records with a modern UI.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="/dashboard" // eslint-disable-line jsx-a11y/anchor-is-valid
              className="rounded-md bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
            >
              Go to Dashboard
            </a>
            <a
              href="#features"
              className="rounded-md border border-gray-300 px-5 py-2.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-section">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Room Occupancy',
              desc: 'Real-time view powered by MySQL views and Spring Boot.',
            },
            { title: 'Bookings', desc: 'Transaction-safe bed booking with conflict handling.' },
            { title: 'Search', desc: 'Exact and fuzzy search across students and repairs.' },
            { title: 'Exports', desc: 'On-demand CSV export for reports and audits.' },
            { title: 'Captcha Login', desc: 'Hardened login with visual captcha verification.' },
            { title: 'RBAC', desc: 'Role-based UI and API access for Admin/Manager/Student.' },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container-section">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>Admins and managers sign in and manage rooms and beds.</li>
            <li>Students book available beds; conflicts are prevented transactionally.</li>
            <li>Managers monitor occupancy and export CSV reports.</li>
          </ol>
        </div>
      </section>

      {/* About */}
      <section className="container-section">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">About</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            This UI is built with Next.js App Router, Tailwind CSS, and a Spring Boot backend.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container-section border-t border-gray-200 dark:border-gray-800">
        <p className="text-center text-sm text-gray-500">© {new Date().getFullYear()} Dormitory System</p>
      </footer>
    </>
  )
}
