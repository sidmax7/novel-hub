export interface Novel {
  novelId: string
  title: string
  genres: {
    name: string
  }[]
  synopsis: string
  rating: number
  coverPhoto: string
  publishers: {
    original: string
    english?: string
  }
  likes: number
  availability: {
    type: "FREE" | "PAID" | "FREEMIUM"
  }
  tags: string[]
} 