import type { Project } from '../data/projects'
import type { ProjectArt } from '../hooks/useProjectArt'
import { useT } from '../i18n'
import { Channels } from '../components/Channels'
import { Hero } from '../components/Hero'
import { Marquee } from '../components/Marquee'
import { Model } from '../components/Model'
import { ProjectIndex } from '../components/ProjectIndex'
import { Vision } from '../components/Vision'
import { WhyLinux } from '../components/WhyLinux'
import { WorkShowcase } from '../components/WorkShowcase'

interface HomeProps {
  projects: Project[]
  art: ProjectArt
  live: boolean
  ready: boolean
}

export function Home({ projects, art, live, ready }: HomeProps) {
  const t = useT()
  return (
    <main id="main">
      <Hero projects={projects} ready={ready} />
      <Marquee items={t.marquee[0]} />
      <WorkShowcase projects={projects} art={art} live={live} />
      <ProjectIndex projects={projects} artUrls={art.urls} />
      <WhyLinux />
      <Model />
      <Marquee reverse items={t.marquee[1]} />
      <Vision />
      <Channels />
    </main>
  )
}
