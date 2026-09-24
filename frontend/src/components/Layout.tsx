import { Link, Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-ink">
            RocketLab Movie Admin
          </Link>
          <Link
            to="/movies/new"
            className="ml-auto rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Cadastrar filme
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
