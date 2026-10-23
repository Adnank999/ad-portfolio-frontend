import { createFileRoute } from '@tanstack/react-router'
import { uploadMedia } from '@/server/media'

export const Route = createFileRoute('/api/admin/media')({
  server: { handlers: { POST: ({ request }) => uploadMedia(request) } },
})
