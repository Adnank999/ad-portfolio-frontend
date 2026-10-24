import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { uploadProjectImages } from '@/lib/project-gallery'
import { useImageUpload } from './upload'

export function useProjectGalleryUpload() {
  const imageUpload = useImageUpload('gallery')
  const cancelled = useRef(false)
  const mutation = useMutation({
    mutationKey: ['assets', 'project-gallery'], retry: false, gcTime: 0,
    mutationFn: (files: File[]) => {
      cancelled.current = false
      return uploadProjectImages(files, file => {
        if (cancelled.current) return Promise.reject(new Error('Gallery upload cancelled'))
        return imageUpload.mutateAsync(file)
      })
    },
  })
  return { ...mutation, imageUpload, cancel: () => { cancelled.current = true; imageUpload.cancel() } }
}
