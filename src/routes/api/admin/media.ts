import { createFileRoute } from '@tanstack/react-router'
import { uploadMedia } from '@/server/media'
import { directImageMetadata } from '@/server/direct-image-uploads'

export const Route = createFileRoute('/api/admin/media')({
  server: { handlers: { POST: ({ request }) => request.headers.get('content-type')?.split(';')[0] === 'application/json' ? directImageMetadata(request) : uploadMedia(request) } },
})
