import { MovieDetails } from "../App";

interface MovieGridProps {
  movies: MovieDetails[];
  favorites: string[];
  onToggleFavorite: (movieId: string) => void;
  onMovieClick: (movieId: string) => void;
}

export default function MovieGrid({
  movies,
  favorites,
  onToggleFavorite,
  onMovieClick,
}: MovieGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map((movie) => (
        <div
          key={movie.imdbID}
          className="bg-secondary-color rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 cursor-pointer"
          onClick={() => onMovieClick(movie.imdbID)}
        >
          <div className="relative">
            <img
              src={
                movie.Poster !== "N/A"
                  ? movie.Poster
                  : "https://via.placeholder.com/300x450?text=No+Poster"
              }
              alt={movie.Title}
              className="w-full h-auto object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(movie.imdbID);
              }}
              className="absolute top-2 right-2 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
            >
              {favorites.includes(movie.imdbID) ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white truncate">
              {movie.Title}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <span className="text-yellow-400">★</span>
                <span className="ml-1 text-gray-300">{movie.imdbRating}</span>
              </div>
              <span className="text-gray-400">{movie.Year}</span>
            </div>
            {movie.Genre && (
              <div className="mt-2">
                <span className="text-sm text-gray-400">{movie.Genre}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
