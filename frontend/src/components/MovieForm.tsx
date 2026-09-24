import { Check, FilmSlate } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { ApiError } from '../api/client'
import { listGenres } from '../api/genres'
import { focusRingClass } from '../styles/interactive'
import type { Genre, MovieDetail, MovieInput } from '../types/movie'
import { translateGenreName } from '../utils/genreLabels'

const STATUS_OPTIONS = ['Planejado', 'Em Produção', 'Pós-Produção', 'Lançado']

const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

interface FieldProps {
  label: string
  htmlFor: string
  children: React.ReactNode
}

function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  )
}

interface ImagePreviewProps {
  url: string
  alt: string
  containerClassName: string
}

function ImagePreview({ url, alt, containerClassName }: ImagePreviewProps) {
  const [failed, setFailed] = useState(false)

  if (!url.trim()) return null

  return (
    <div className={`mt-2 overflow-hidden rounded-md border border-border bg-zinc-100 ${containerClassName}`}>
      {failed ? (
        <div className="flex h-full w-full items-center justify-center text-zinc-300">
          <FilmSlate size={28} weight="light" />
        </div>
      ) : (
        <img src={url} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
    </div>
  )
}

interface MovieFormValues {
  titulo: string
  data_lancamento: string
  ano_lancamento: string
  duracao_minutos: string
  status_filme: string
  sinopse: string
  url_poster: string
  url_backdrop: string
  genre_ids: string[]
  diretor: string
}

const EMPTY_VALUES: MovieFormValues = {
  titulo: '',
  data_lancamento: '',
  ano_lancamento: '',
  duracao_minutos: '',
  status_filme: '',
  sinopse: '',
  url_poster: '',
  url_backdrop: '',
  genre_ids: [],
  diretor: '',
}

function toFormValues(input?: Partial<MovieInput>): MovieFormValues {
  if (!input) return EMPTY_VALUES
  return {
    titulo: input.titulo ?? '',
    data_lancamento: input.data_lancamento ?? '',
    ano_lancamento: input.ano_lancamento?.toString() ?? '',
    duracao_minutos: input.duracao_minutos?.toString() ?? '',
    status_filme: input.status_filme ?? '',
    sinopse: input.sinopse ?? '',
    url_poster: input.url_poster ?? '',
    url_backdrop: input.url_backdrop ?? '',
    genre_ids: input.genre_ids ?? [],
    diretor: input.diretor ?? '',
  }
}

function toMovieInput(values: MovieFormValues): MovieInput {
  return {
    titulo: values.titulo.trim(),
    data_lancamento: values.data_lancamento || null,
    ano_lancamento: values.ano_lancamento ? Number(values.ano_lancamento) : null,
    duracao_minutos: values.duracao_minutos ? Number(values.duracao_minutos) : null,
    status_filme: values.status_filme || null,
    sinopse: values.sinopse.trim() || null,
    url_poster: values.url_poster.trim() || null,
    url_backdrop: values.url_backdrop.trim() || null,
    genre_ids: values.genre_ids,
    diretor: values.diretor.trim() || null,
  }
}

interface MovieFormProps {
  initialValues?: Partial<MovieInput>
  submitLabel: string
  onSubmit: (input: MovieInput) => Promise<MovieDetail>
  onSuccess: (movie: MovieDetail) => void
}

function MovieForm({ initialValues, submitLabel, onSubmit, onSuccess }: MovieFormProps) {
  const [values, setValues] = useState<MovieFormValues>(() => toFormValues(initialValues))
  const [genres, setGenres] = useState<Genre[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listGenres()
      .then(setGenres)
      .catch(() => setGenres([]))
  }, [])

  function updateField<K extends keyof MovieFormValues>(field: K, value: MovieFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleDateChange(value: string) {
    setValues((current) => ({
      ...current,
      data_lancamento: value,
      ano_lancamento: value ? value.slice(0, 4) : current.ano_lancamento,
    }))
  }

  function toggleGenre(genreId: string) {
    setValues((current) => ({
      ...current,
      genre_ids: current.genre_ids.includes(genreId)
        ? current.genre_ids.filter((id) => id !== genreId)
        : [...current.genre_ids, genreId],
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const movie = await onSubmit(toMovieInput(values))
      onSuccess(movie)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar o filme.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <Field label="Título" htmlFor="titulo">
        <input
          id="titulo"
          type="text"
          required
          maxLength={500}
          value={values.titulo}
          onChange={(event) => updateField('titulo', event.target.value)}
          className={`${inputClass} max-w-lg`}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Ano" htmlFor="ano_lancamento">
          <input
            id="ano_lancamento"
            type="number"
            min={1888}
            max={2100}
            value={values.ano_lancamento}
            onChange={(event) => updateField('ano_lancamento', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Data de lançamento" htmlFor="data_lancamento">
          <input
            id="data_lancamento"
            type="date"
            value={values.data_lancamento}
            onChange={(event) => handleDateChange(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Duração (min)" htmlFor="duracao_minutos">
          <input
            id="duracao_minutos"
            type="number"
            min={0}
            value={values.duracao_minutos}
            onChange={(event) => updateField('duracao_minutos', event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Status" htmlFor="status_filme">
        <select
          id="status_filme"
          value={values.status_filme}
          onChange={(event) => updateField('status_filme', event.target.value)}
          className={inputClass}
        >
          <option value="">Não informado</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sinopse" htmlFor="sinopse">
        <textarea
          id="sinopse"
          rows={4}
          maxLength={4000}
          value={values.sinopse}
          onChange={(event) => updateField('sinopse', event.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="URL do pôster" htmlFor="url_poster">
          <input
            id="url_poster"
            type="url"
            value={values.url_poster}
            onChange={(event) => updateField('url_poster', event.target.value)}
            className={inputClass}
          />
          <ImagePreview
            key={values.url_poster}
            url={values.url_poster}
            alt="Pré-visualização do pôster"
            containerClassName="aspect-2/3 w-28"
          />
        </Field>
        <Field label="URL do backdrop" htmlFor="url_backdrop">
          <input
            id="url_backdrop"
            type="url"
            value={values.url_backdrop}
            onChange={(event) => updateField('url_backdrop', event.target.value)}
            className={inputClass}
          />
          <ImagePreview
            key={values.url_backdrop}
            url={values.url_backdrop}
            alt="Pré-visualização do backdrop"
            containerClassName="aspect-video w-48"
          />
        </Field>
      </div>

      <Field label="Diretor" htmlFor="diretor">
        <input
          id="diretor"
          type="text"
          maxLength={255}
          value={values.diretor}
          onChange={(event) => updateField('diretor', event.target.value)}
          className={inputClass}
        />
      </Field>

      <div>
        <span className="text-sm font-medium text-ink">Gêneros</span>
        <p className="mt-0.5 text-xs text-ink-muted">Selecione um ou mais gêneros.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {genres === null && <span className="text-sm text-ink-muted">Carregando...</span>}
          {genres?.map((genre) => {
            const selected = values.genre_ids.includes(genre.sk_genre_id)
            return (
              <button
                key={genre.sk_genre_id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleGenre(genre.sk_genre_id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${focusRingClass} ${
                  selected
                    ? 'border-accent bg-accent text-ink'
                    : 'border-border text-ink-muted hover:border-accent'
                }`}
              >
                {selected && <Check size={12} />}
                {translateGenreName(genre.nome_genero)}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Salvando...' : submitLabel}
      </button>
    </form>
  )
}

export default MovieForm
