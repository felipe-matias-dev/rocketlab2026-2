import { createBrowserRouter } from 'react-router-dom'

import Layout from './components/Layout'
import CatalogPage from './pages/CatalogPage'
import CreateMoviePage from './pages/CreateMoviePage'
import DashboardPage from './pages/DashboardPage'
import EditMoviePage from './pages/EditMoviePage'
import MovieDetailPage from './pages/MovieDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: CatalogPage, handle: { title: 'Catálogo' } },
      { path: 'dashboard', Component: DashboardPage, handle: { title: 'Dashboard' } },
      {
        path: 'movies/new',
        Component: CreateMoviePage,
        handle: { title: 'Cadastrar filme', hideCreateAction: true },
      },
      { path: 'movies/:movieId', Component: MovieDetailPage },
      { path: 'movies/:movieId/edit', Component: EditMoviePage },
    ],
  },
])
