import { Link, Outlet, useMatches } from 'react-router-dom'

import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'
import { ToastProvider } from './Toast'

type RouteHandle = { title?: string; hideCreateAction?: boolean }

function Layout() {
  const matches = useMatches()
  const handles = matches.map((match) => match.handle as RouteHandle | undefined)
  const title = handles.map((handle) => handle?.title).findLast((value): value is string => Boolean(value))
  const hideCreateAction = handles.some((handle) => handle?.hideCreateAction)

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-paper text-ink">
        <header className="border-b border-border">
          <nav className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 py-4">
            <Link to="/" className={`flex w-fit items-center gap-1 rounded-md ${focusRingClass}`}>
              <img src="/logo.svg" alt="" className="h-15 w-auto" />
              <span className="leading-tight">
                <span className="block text-lg font-semibold tracking-tight text-ink">
                  ROCKET <span className="text-accent">LAB</span>
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-widest text-ink-muted">
                  Movie Admin
                </span>
              </span>
            </Link>
            <div className="text-center">
              {title && <h1 className="text-lg font-semibold text-ink">{title}</h1>}
            </div>
            <div className="flex justify-end">
              {!hideCreateAction && (
                <Link
                  to="/movies/new"
                  className={`rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-hover ${pressableClass} ${focusRingClass}`}
                >
                  Cadastrar filme
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  )
}

export default Layout
