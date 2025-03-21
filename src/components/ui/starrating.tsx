import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number;
  userRating?: number;
  onRate?: (rating: number) => void;
  size?: number;
}

export function StarRating({ rating, userRating, onRate, size = 20 }: StarRatingProps) {
  // Create an array of 10 values representing half-stars: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
  const halfStars = Array.from({ length: 10 }, (_, i) => (i + 1) * 0.5);
  
  // Function to handle star click with half-star precision
  const handleStarClick = (starIndex: number, isLeft: boolean) => {
    if (!onRate) return;
    
    // Calculate the rating based on which part of the star was clicked
    // If left half was clicked, subtract 0.5 from the full star value
    const clickedRating = isLeft ? starIndex - 0.5 : starIndex;
    onRate(clickedRating);
  };
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const displayRating = userRating || rating;
        const isFullStar = displayRating >= starIndex;
        const isHalfStar = !isFullStar && displayRating >= starIndex - 0.5;
        
        return (
          <div key={starIndex} className="relative">
            {/* Invisible click areas for half-star precision */}
            <div className="absolute inset-0 flex z-10">
              {/* Left half click area */}
              <div 
                className={`w-1/2 h-full ${onRate ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleStarClick(starIndex, true)}
              />
              {/* Right half click area */}
              <div 
                className={`w-1/2 h-full ${onRate ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleStarClick(starIndex, false)}
              />
            </div>
            
            {/* Star SVG with half or full fill */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 20 20"
              className={`${onRate ? 'hover:scale-110' : ''} transition-transform duration-200`}
            >
              {/* Star outline */}
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                fill="none"
                stroke="#D1D5DB"
              />
              
              {/* Full star fill */}
              {isFullStar && (
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  fill="#FFD700"
                  stroke="#FFD700"
                />
              )}
              
              {/* Half star fill */}
              {isHalfStar && (
                <defs>
                  <clipPath id={`half-star-clip-${starIndex}`}>
                    <rect x="0" y="0" width="10" height="20" />
                  </clipPath>
                </defs>
              )}
              
              {isHalfStar && (
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  fill="#FFD700"
                  stroke="#FFD700"
                  clipPath={`url(#half-star-clip-${starIndex})`}
                />
              )}
            </svg>
          </div>
        );
      })}
    </div>
  );
}