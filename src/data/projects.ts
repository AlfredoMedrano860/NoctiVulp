export type Category = 'linux' | 'gaming' | 'apps' | 'design'

export const CATEGORIES: Category[] = ['linux', 'gaming', 'apps', 'design']

export interface Project {
  name: string
  description: string
  language: string | null
  license: string | null
  url: string
  stars: number
  updatedAt: string
  category: Category
}

const CATEGORY_BY_REPO: Record<string, Category> = {
  'cast-dlna': 'linux',
  castlabnv: 'linux',
  maidscout: 'gaming',
  modpacklooter: 'gaming',
  seedscout: 'gaming',
  'toml-translator': 'gaming',
  buyingvulpes: 'apps',
  vulptiketing: 'apps',
  'cast-dlna-tv': 'apps',
  wulfenite_ui: 'design',
}

export function categorize(repoName: string): Category {
  return CATEGORY_BY_REPO[repoName.toLowerCase()] ?? 'apps'
}

export const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Dart: '#00B4AB',
  Kotlin: '#A97BFF',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  Shell: '#89e051',
}

const repo = (
  name: string,
  language: string,
  description: string,
  updatedAt: string,
  license = 'GPL-3.0',
): Project => ({
  name,
  language,
  description,
  updatedAt,
  license,
  stars: 0,
  url: `https://github.com/noctivulp-ch/${name}`,
  category: categorize(name),
})

// Respaldo por si la API de GitHub no responde (límite de peticiones, sin red…).
export const FALLBACK_PROJECTS: Project[] = [
  repo('cast-dlna-tv', 'Kotlin', 'Receptor DLNA/UPnP para Android TV, pensado para manejarse con el mando.', '2026-10-25T22:42:02Z'),
  repo('ModPackLooter', 'Go', '', '2026-10-25T22:41:56Z'),
  repo('toml-translator', 'Python', 'Traducción automática de textos de videojuegos con modelos locales o en la nube.', '2026-10-25T22:41:58Z'),
  repo('MaidScout', 'Python', 'Visor local de modelos Bedrock para los paquetes de Touhou Little Maid.', '2026-10-25T22:41:54Z'),
  repo('SeedScout', 'Python', 'Explorador de semillas para modpacks de Minecraft, con el mapa real generado por el servidor del modpack.', '2026-10-25T22:41:51Z'),
  repo('wulfenite_ui', 'Dart', 'Sistema de diseño de NoctiVulp: tres librerías gemelas para Flutter, Qt (Python) y Jetpack Compose.', '2026-10-25T22:41:48Z', 'LGPL-3.0'),
  repo('BuyingVulpes', 'Dart', 'Listas de compras por tienda, con presupuesto a la vista y un desglose en PDF de cada compra.', '2026-10-25T22:41:45Z'),
  repo('VulpTiketing', 'Dart', 'Caja, inventario y reportes para un negocio de comidas pequeño. Funciona sin internet y sincroniza por la red local.', '2026-10-25T22:41:43Z'),
  repo('cast-dlna', 'Python', 'Receptor DLNA/UPnP completo para el escritorio Linux, con mpv como reproductor.', '2026-10-21T12:33:51Z'),
  repo('CastLabNV', 'TypeScript', 'Fork de CastLab (tom79) que añade el audio de reproducción al compartir pantalla por DLNA. GPL-3.0.', '2026-10-21T12:33:50Z'),
]
