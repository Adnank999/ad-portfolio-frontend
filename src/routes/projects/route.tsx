import { createFileRoute } from '@tanstack/react-router'
import { TerrainProjectLayout } from '../../components/terrain-recreation/TerrainProjectLayout'

export const Route = createFileRoute('/projects')({ component: TerrainProjectLayout })
