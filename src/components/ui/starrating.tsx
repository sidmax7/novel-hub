import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number;
  userRating?: number;
  onRate?: (rating: number) => void;
  size?: number;
}

export function StarRating({ rating, userRating, onRate, size = 20 }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  
  return (
    <div className="flex">
      {stars.map((star) => (
        <button
          key={star}
          onClick={() => onRate?.(star)}
          className={`${onRate ? 'cursor-pointer hover:scale-110' : 'cursor-default'} 
            transition-transform duration-200`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill={star <= (userRating || rating) ? '#FFD700' : 'none'}
            stroke={star <= (userRating || rating) ? '#FFD700' : '#D1D5DB'}
            className="transition-colors duration-200"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}