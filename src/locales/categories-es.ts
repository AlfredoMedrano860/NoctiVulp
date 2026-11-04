import type { Category } from '../data/projects.ts'

// Nombres de las categorías en español. También los usan las portadas generadas,
// que van siempre en español porque son parte del arte, no de la interfaz.
export const CATEGORY_LABELS_ES: Record<Category, string> = { linux: 'Escritorio Linux', gaming: 'Gaming y modding', apps: 'Apps', design: 'Diseño' }
