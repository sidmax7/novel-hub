import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  className?: string
}

export function StarRating({ rating, className = '' }: StarRatingProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="relative">
          <Star className="w-5 h-5 text-gray-300" />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${Math.max(0, Math.min((rating - i) * 100, 100))}%` }}
          >
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </div>
        </div>
      ))}
      <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  )
}