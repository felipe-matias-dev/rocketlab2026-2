// Anel de foco compartilhado para botões/links (não para <input>/<select>, que já usam
// focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none).
// ring-accent sozinho é ~2.15:1 contra branco e falha o mínimo não-textual de 3:1 (WCAG 1.4.11);
// ring-ink chega a ~17.7:1.
export const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'
