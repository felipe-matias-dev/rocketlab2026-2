import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'

import Layout from './Layout'

function renderWithRoutes(children: RouteObject[], initialPath = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children,
      },
    ],
    { initialEntries: [initialPath] },
  )
  return render(<RouterProvider router={router} />)
}

describe('Layout', () => {
  beforeEach(() => {
    sessionStorage.setItem('rocketlab:reviewerName', 'Ana')
  })

  it('renders the matched child route inside the outlet', () => {
    renderWithRoutes([{ index: true, element: <p>Conteúdo da página</p> }])

    expect(screen.getByText('Conteúdo da página')).toBeInTheDocument()
  })

  it('shows the title from the current route handle', () => {
    renderWithRoutes([{ index: true, element: <p>Home</p>, handle: { title: 'Catálogo' } }])

    expect(screen.getAllByRole('heading', { name: 'Catálogo' }).length).toBeGreaterThan(0)
  })

  it('shows no title heading when the route declares none', () => {
    renderWithRoutes([{ index: true, element: <p>Home</p> }])

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('prefers the deepest route’s title when nested routes both set one', () => {
    renderWithRoutes([
      {
        path: 'movies',
        handle: { title: 'Filmes' },
        children: [{ index: true, element: <p>Detalhe</p>, handle: { title: 'Detalhe do filme' } }],
      },
    ], '/movies')

    expect(screen.getAllByRole('heading', { name: 'Detalhe do filme' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: 'Filmes' })).not.toBeInTheDocument()
  })

  it('shows the "Cadastrar filme" action by default', () => {
    renderWithRoutes([{ index: true, element: <p>Home</p> }])

    expect(screen.getByRole('link', { name: 'Cadastrar filme' })).toBeInTheDocument()
  })

  it('hides the "Cadastrar filme" action when the route opts out', () => {
    renderWithRoutes([{ index: true, element: <p>Home</p>, handle: { hideCreateAction: true } }])

    expect(screen.queryByRole('link', { name: 'Cadastrar filme' })).not.toBeInTheDocument()
  })

  it('marks the Dashboard nav link as active on the dashboard route', () => {
    renderWithRoutes(
      [{ path: 'dashboard', element: <p>Dashboard</p> }],
      '/dashboard',
    )

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveClass('text-accent')
  })

  it('does not mark the Dashboard nav link as active elsewhere', () => {
    renderWithRoutes([{ index: true, element: <p>Home</p> }])

    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('text-accent')
  })
})
