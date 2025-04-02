import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export default function Image({ 
  src, 
  alt, 
  className, 
  fallback = '/assets/image-placeholder.svg',
  loading = 'lazy',
  ...props 
}: ImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src || fallback)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setImageSrc(src || fallback)
    setError(false)
  }, [src, fallback])

  return (
    <img
      src={imageSrc}
      alt={alt || 'Image'}
      className={cn(
        'transition-opacity duration-300',
        !isLoaded && 'opacity-0',
        error && 'grayscale opacity-70',
        className
      )}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        setError(true)
        setImageSrc(fallback)
      }}
      loading={loading}
      {...props}
    />
  )
}