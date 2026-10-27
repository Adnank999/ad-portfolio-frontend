import type { PublishedService } from './services'

const legacyCopy = [
  ['as an independent full-stack developer based in Bangladesh. If you are comparing nearshore partners, we first establish whether my location, availability, and working-hour overlap fit your needs.', 'as an independent developer. We first establish whether my availability, working style, and working-hour overlap fit your team.'],
  ['I am an independent developer based in Bangladesh. Whether that location is nearshore to you depends on where your team works. This service is a direct collaboration with me; staffing a larger team is outside the standard scope.', 'I am an independent developer, not an agency. This service is a direct collaboration with me, with scope and working-hour overlap agreed around your team; staffing a larger team is outside the standard scope.'],
] as const

export function publicServiceCopy(service: PublishedService): PublishedService {
  if (service.slug !== 'nearshore-software-development') return service
  return JSON.parse(JSON.stringify(service, (_key, value: unknown) => {
    if (typeof value !== 'string') return value
    return legacyCopy.reduce((copy, [before, after]) => copy.replaceAll(before, after), value)
  })) as PublishedService
}
