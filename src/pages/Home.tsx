import type { Project } from '../data/projects'
import type { ProjectArt } from '../hooks/useProjectArt'
import { Channels } from '../components/Channels'
import { Hero } from '../components/Hero'
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
  return (
    <main id="main">
      <Hero projects={projects} ready={ready} />
      <WorkShowcase projects={projects} art={art} live={live} />
      <ProjectIndex projects={projects} artUrls={art.urls} />
      <WhyLinux />
      <Model />
      <Vision />
      <Channels />
    </main>
  )
}
