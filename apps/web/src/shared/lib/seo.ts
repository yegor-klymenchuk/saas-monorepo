export interface SeoProps {
  title: string
  description?: string
  image?: string
  keywords?: string
}

export const seo = ({
  title,
  description,
  keywords,
  image,
}: SeoProps): Array<{ title: string } | { name: string; content: string | undefined }> => {
  return [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'og:type', content: 'website' },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    ...(image ? [{ name: 'og:image', content: image }] : []),
  ]
}
