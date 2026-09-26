import { Link, NavLink, Outlet, useMatches } from 'react-router-dom'

import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'
import ReviewerNameGate from './ReviewerNameGate'
import { ToastProvider } from './Toast'

type RouteHandle = { title?: string; hideCreateAction?: boolean }

function Layout() {
  const matches = useMatches()
  const handles = matches.map((match) => match.handle as RouteHandle | undefined)
  const title = handles.map((handle) => handle?.title).findLast((value): value is string => Boolean(value))
  const hideCreateAction = handles.some((handle) => handle?.hideCreateAction)

  return (
    <ReviewerNameGate>
      <ToastProvider>
        <div className="min-h-dvh bg-paper text-ink">
          <header className="border-b border-border">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4">
              <nav className="flex items-center justify-between gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
                <div className="flex min-w-0 shrink-0 items-center gap-4">
                  <Link to="/" className={`flex w-fit shrink-0 items-center gap-1 rounded-md ${focusRingClass}`}>
                    <img src="/logo.svg" alt="" className="h-10 w-auto sm:h-15" />
                    <span className="leading-tight">
                      <span className="block text-base font-semibold tracking-tight text-ink sm:text-lg">
                        ROCKET <span className="text-accent">LAB</span>
                      </span>
                      <span className="hidden text-[10px] font-medium uppercase tracking-widest text-ink-muted sm:block">
                        Movie Admin
                      </span>
                    </span>
                  </Link>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `shrink-0 rounded-md px-1 py-1 text-sm font-medium ${pressableClass} ${focusRingClass} ${
                        isActive ? 'text-accent' : 'text-ink-muted hover:text-ink'
                      }`
                    }
                  >
                    Dashboard
                  </NavLink>
                </div>
                <div className="hidden text-center sm:block">
                  {title && <h1 className="text-lg font-semibold text-ink">{title}</h1>}
                </div>
                <div className="flex shrink-0 justify-end">
                  {!hideCreateAction && (
                    <Link
                      to="/movies/new"
                      className={`whitespace-nowrap rounded-md bg-accent px-3 py-2 text-sm font-medium text-ink hover:bg-accent-hover sm:px-4 ${pressableClass} ${focusRingClass}`}
                    >
                      Cadastrar filme
                    </Link>
                  )}
                </div>
              </nav>
              {title && (
                <h1 className="mt-2 text-center text-base font-semibold text-ink sm:hidden">{title}</h1>
              )}
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8">
            <Outlet />
          </main>
        </div>
      </ToastProvider>
    </ReviewerNameGate>
  )
}

export default Layout
