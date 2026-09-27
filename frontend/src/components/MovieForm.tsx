import { Check, CircleNotch, FilmSlate } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { ApiError } from '../api/client'
import { listGenres } from '../api/genres'
import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'
import type { Genre, MovieDetail, MovieInput } from '../types/movie'
import { translateGenreName } from '../utils/genreLabels'
import TagsInput from './TagsInput'

const STATUS_OPTIONS = ['Planejado', 'Em Produção', 'Pós-Produção', 'Lançado']

const inputClass =
  'w-full rounded-md border border-zinc-400 bg-surface px-3 py-2 text-sm text-ink focus:border-accent-hover focus:outline-none focus:ring-2 focus:ring-ink'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}

function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      <p
        id={`${htmlFor}-error`}
        className={`min-h-4 text-xs transition-discrete transition-[opacity,transform,visibility] duration-150 ease-out motion-reduce:transition-none ${
          error ? 'visible translate-y-0 text-destructive opacity-100' : 'invisible -translate-y-0.5 opacity-0'
        }`}
      >
        {error ?? 'placeholder'}
      </p>
    </div>
  )
}

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="rounded-md border border-border bg-surface p-6">
      <h2 className="border-b border-border pb-3 text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
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
    <div
      className={`mt-2 overflow-hidden rounded-md border border-border bg-surface-muted motion-safe:animate-fade-in motion-reduce:animate-none ${containerClassName}`}
    >
      {failed ? (
        <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
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
  diretores: string[]
  atores: string[]
  roteiristas: string[]
  produtoras: string[]
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
  diretores: [],
  atores: [],
  roteiristas: [],
  produtoras: [],
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
    diretores: input.diretores ?? [],
    atores: input.atores ?? [],
    roteiristas: input.roteiristas ?? [],
    produtoras: input.produtoras ?? [],
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
    diretores: values.diretores,
    atores: values.atores,
    roteiristas: values.roteiristas,
    produtoras: values.produtoras,
  }
}

interface MovieFormProps {
  initialValues?: Partial<MovieInput>
  submitLabel: string
  onSubmit: (input: MovieInput) => Promise<MovieDetail>
  onSuccess: (movie: MovieDetail) => void
}

type ValidatedField = 'titulo' | 'url_poster' | 'url_backdrop'

function validateField(field: ValidatedField, value: string): string | undefined {
  if (field === 'titulo') {
    return value.trim() ? undefined : 'Título é obrigatório.'
  }
  if (!value.trim()) return undefined
  try {
    new URL(value)
    return undefined
  } catch {
    return 'Informe uma URL válida.'
  }
}

function MovieForm({ initialValues, submitLabel, onSubmit, onSuccess }: MovieFormProps) {
  const [values, setValues] = useState<MovieFormValues>(() => toFormValues(initialValues))
  const [genres, setGenres] = useState<Genre[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ValidatedField, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listGenres()
      .then(setGenres)
      .catch(() => setGenres([]))
  }, [])

  function updateField<K extends keyof MovieFormValues>(field: K, value: MovieFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    if (field === 'titulo' || field === 'url_poster' || field === 'url_backdrop') {
      setFieldErrors((current) => ({ ...current, [field as ValidatedField]: undefined }))
    }
  }

  function handleFieldBlur(field: ValidatedField) {
    setFieldErrors((current) => ({ ...current, [field]: validateField(field, values[field]) }))
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

    const nextFieldErrors: Partial<Record<ValidatedField, string>> = {
      titulo: validateField('titulo', values.titulo),
      url_poster: validateField('url_poster', values.url_poster),
      url_backdrop: validateField('url_backdrop', values.url_backdrop),
    }
    setFieldErrors(nextFieldErrors)
    if (Object.values(nextFieldErrors).some(Boolean)) return

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
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-6">
      <FormSection title="Informações gerais">
        <Field label="Título" htmlFor="titulo" error={fieldErrors.titulo}>
          <input
            id="titulo"
            type="text"
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.titulo)}
            aria-describedby="titulo-error"
            maxLength={500}
            value={values.titulo}
            onChange={(event) => updateField('titulo', event.target.value)}
            onBlur={() => handleFieldBlur('titulo')}
            className={inputClass}
          />
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
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${pressableClass} ${focusRingClass} ${
                    selected
                      ? 'border-accent bg-accent text-ink'
                      : 'border-border text-ink-muted hover:border-accent'
                  }`}
                >
                  {selected && (
                    <Check size={12} className="motion-safe:animate-pop-in motion-reduce:animate-none" />
                  )}
                  {translateGenreName(genre.nome_genero)}
                </button>
              )
            })}
          </div>
        </div>

        <TagsInput
          id="diretores"
          label="Diretores"
          values={values.diretores}
          onChange={(diretores) => updateField('diretores', diretores)}
          placeholder="Nome e Enter para adicionar"
        />

        <TagsInput
          id="atores"
          label="Elenco"
          values={values.atores}
          onChange={(atores) => updateField('atores', atores)}
          placeholder="Nome e Enter para adicionar"
        />

        <TagsInput
          id="roteiristas"
          label="Roteiristas"
          values={values.roteiristas}
          onChange={(roteiristas) => updateField('roteiristas', roteiristas)}
          placeholder="Nome e Enter para adicionar"
        />

        <TagsInput
          id="produtoras"
          label="Produtoras"
          values={values.produtoras}
          onChange={(produtoras) => updateField('produtoras', produtoras)}
          placeholder="Nome e Enter para adicionar"
        />
      </FormSection>

      <FormSection title="Detalhes de lançamento">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        </div>
      </FormSection>

      <FormSection title="Multimédia">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL do pôster" htmlFor="url_poster" error={fieldErrors.url_poster}>
            <input
              id="url_poster"
              type="url"
              aria-invalid={Boolean(fieldErrors.url_poster)}
              aria-describedby="url_poster-error"
              value={values.url_poster}
              onChange={(event) => updateField('url_poster', event.target.value)}
              onBlur={() => handleFieldBlur('url_poster')}
              className={inputClass}
            />
            <ImagePreview
              key={values.url_poster}
              url={values.url_poster}
              alt="Pré-visualização do pôster"
              containerClassName="aspect-2/3 w-28"
            />
          </Field>
          <Field label="URL do backdrop" htmlFor="url_backdrop" error={fieldErrors.url_backdrop}>
            <input
              id="url_backdrop"
              type="url"
              aria-invalid={Boolean(fieldErrors.url_backdrop)}
              aria-describedby="url_backdrop-error"
              value={values.url_backdrop}
              onChange={(event) => updateField('url_backdrop', event.target.value)}
              onBlur={() => handleFieldBlur('url_backdrop')}
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
      </FormSection>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className={`inline-flex w-fit items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${pressableClass}`}
      >
        {submitting && <CircleNotch size={16} weight="bold" className="animate-spin motion-reduce:animate-none" />}
        {submitting ? 'Salvando...' : submitLabel}
      </button>
    </form>
  )
}

export default MovieForm
