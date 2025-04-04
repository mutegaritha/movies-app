import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

interface MovieCardProps {
  imdbID: string;
  Title: string;
  Poster: string;
  Year: string;
  imdbRating: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const MovieCard = ({
  imdbID,
  Title,
  Poster,
  Year,
  imdbRating,
  isFavorite = false,
  onToggleFavorite,
}: MovieCardProps) => {
  return (
    <div className="bg-secondary-color rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
      <div className="relative">
        <img
          src={
            Poster !== "N/A"
              ? Poster
              : "https://via.placeholder.com/300x450?text=No+Poster"
          }
          alt={Title}
          className="w-full h-auto object-cover"
        />
        <button
          onClick={() => onToggleFavorite?.(imdbID)}
          className="absolute top-2 right-2 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
        >
          {isFavorite ? (
            <HeartIconSolid className="h-6 w-6 text-red-500" />
          ) : (
            <HeartIcon className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{Title}</h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="ml-1 text-gray-300">{imdbRating}</span>
          </div>
          <span className="text-gray-400">{Year}</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
