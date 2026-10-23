import { useMutation } from '@tanstack/react-query'
import { uploadProjectImages } from '@/lib/project-gallery'
import { uploadImage } from './upload'

export function useProjectGalleryUpload() {
  return useMutation({
    mutationKey: ['assets', 'project-gallery'], retry: false, gcTime: 0,
    mutationFn: (files: File[]) => uploadProjectImages(files, uploadImage),
  })
}
