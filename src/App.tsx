import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import MovieGrid from "./components/MovieGrid";

// Using a more reliable API key
const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || "4a3b711b";
const YOUTUBE_API_KEY =
  import.meta.env.VITE_YOUTUBE_API_KEY ||
  "AIzaSyBvGZtZ6QZQZQZQZQZQZQZQZQZQZQZQZQ"; // You'll need to replace this with your actual YouTube API key

// Helper function to determine if we're in development or production
const isDevelopment = import.meta.env.MODE === "development";

// Helper function to get the OMDB API URL
const getOmdbApiUrl = (params: string) => {
  if (isDevelopment) {
    return `https://www.omdbapi.com/?${params}`;
  } else {
    return `/api/omdb/?${params}`;
  }
};

// Helper function to get the YouTube API URL
const getYoutubeApiUrl = (params: string) => {
  if (isDevelopment) {
    return `https://www.googleapis.com/youtube/v3/search?${params}`;
  } else {
    return `/api/youtube/search?${params}`;
  }
};

const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
];

interface Movie {
  imdbID: string;
  Title: string;
  Poster: string;
  Year: string;
  Genre?: string;
}

export interface MovieDetails {
  imdbID: string;
  Title: string;
  Poster: string;
  Year: string;
  imdbRating: string;
  Plot?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Runtime?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  trailerId?: string;
}

function App() {
  const [movies, setMovies] = useState<MovieDetails[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<MovieDetails[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [filteredMovies, setFilteredMovies] = useState<MovieDetails[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string>("");
  const [searchResults, setSearchResults] = useState<MovieDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        console.log("Starting to fetch movies...");
        console.log(
          "Using API key:",
          OMDB_API_KEY ? "API key is set" : "API key is missing"
        );
        console.log("Environment:", import.meta.env.MODE);

        // Fetch trending movies (using popular search terms)
        const trendingTerms = [
          "avengers",
          "inception",
          "interstellar",
          "joker",
          "dune",
          "oppenheimer",
          "barbie",
          "avatar",
          "titanic",
          "matrix",
        ];
        const trendingPromises = trendingTerms.map(async (term) => {
          try {
            console.log(`Fetching trending movie for term: ${term}`);
            const response = await axios.get(
              getOmdbApiUrl(
                `apikey=${OMDB_API_KEY}&s=${term}&type=movie&page=1`
              )
            );
            console.log(`Response for ${term}:`, response.data);

            if (response.data.Response === "True" && response.data.Search) {
              const movie = response.data.Search[0];
              const detailResponse = await axios.get(
                getOmdbApiUrl(
                  `apikey=${OMDB_API_KEY}&i=${movie.imdbID}&plot=short`
                )
              );
              return detailResponse.data;
            }
            return null;
          } catch (err) {
            console.error(
              `Error fetching trending movie for term ${term}:`,
              err
            );
            return null;
          }
        });

        const trendingResults = (await Promise.all(trendingPromises)).filter(
          Boolean
        );
        console.log("Trending movies fetched:", trendingResults.length);
        setTrendingMovies(trendingResults);

        // Fetch regular movies based on selected genre
        const searchTerms =
          selectedGenre === "All"
            ? ["action", "comedy", "drama", "sci-fi", "horror"]
            : [selectedGenre.toLowerCase()];

        const allMovies: MovieDetails[] = [];

        for (const term of searchTerms) {
          try {
            console.log(`Fetching movies for genre: ${term}`);
            const searchResponse = await axios.get(
              getOmdbApiUrl(
                `apikey=${OMDB_API_KEY}&s=${term}&type=movie&page=1`
              )
            );
            console.log(`Search response for ${term}:`, searchResponse.data);

            if (
              searchResponse.data.Response === "True" &&
              searchResponse.data.Search
            ) {
              const movies = searchResponse.data.Search.slice(0, 5);

              const movieDetailsPromises = movies.map(async (movie: Movie) => {
                try {
                  const detailResponse = await axios.get(
                    getOmdbApiUrl(
                      `apikey=${OMDB_API_KEY}&i=${movie.imdbID}&plot=short`
                    )
                  );
                  return detailResponse.data;
                } catch (detailErr) {
                  console.error("Error fetching movie details:", detailErr);
                  return null;
                }
              });

              const movieDetails = (
                await Promise.all(movieDetailsPromises)
              ).filter(Boolean);
              allMovies.push(...movieDetails);
            }
          } catch (err) {
            console.error(`Error fetching movies for genre ${term}:`, err);
          }
        }

        if (allMovies.length > 0) {
          // Remove duplicates based on imdbID
          const uniqueMovies = allMovies.filter(
            (movie, index, self) =>
              index === self.findIndex((m) => m.imdbID === movie.imdbID)
          );

          console.log("Regular movies fetched:", uniqueMovies.length);
          setMovies(uniqueMovies);
          setFilteredMovies(uniqueMovies);
        } else {
          console.error("No movies found for any genre");
          setError("No movie details could be fetched");
        }
      } catch (err) {
        console.error("Error fetching movies:", err);
        if (axios.isAxiosError(err)) {
          console.error("API error details:", err.response?.data);
        }
        setError(
          "Failed to fetch movies. Please try again later. Error: " +
            (err instanceof Error ? err.message : String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [selectedGenre]);

  useEffect(() => {
    if (selectedGenre === "All") {
      setFilteredMovies(movies);
    } else {
      const filtered = movies.filter((movie) =>
        movie.Genre?.toLowerCase().includes(selectedGenre.toLowerCase())
      );
      setFilteredMovies(filtered);
    }
  }, [selectedGenre, movies]);

  const handleToggleFavorite = (movieId: string) => {
    setFavorites((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleMovieClick = async (movieId: string) => {
    try {
      console.log("Fetching movie details for ID:", movieId);
      const response = await axios.get(
        getOmdbApiUrl(`apikey=${OMDB_API_KEY}&i=${movieId}&plot=full`)
      );
      if (response.data.Response === "True") {
        setSelectedMovie(response.data);
        console.log("Movie details fetched successfully:", response.data.Title);

        // Fetch trailer from YouTube
        try {
          console.log("Attempting to fetch trailer for:", response.data.Title);
          console.log(
            "Using YouTube API key:",
            YOUTUBE_API_KEY ? "API key is set" : "API key is missing"
          );

          const searchResponse = await axios.get(
            getYoutubeApiUrl(
              `part=snippet&q=${encodeURIComponent(
                response.data.Title + " official trailer"
              )}&key=${YOUTUBE_API_KEY}&type=video&maxResults=1`
            )
          );

          console.log("YouTube API response:", searchResponse.data);

          if (
            searchResponse.data.items &&
            searchResponse.data.items.length > 0
          ) {
            const videoId = searchResponse.data.items[0].id.videoId;
            console.log("Trailer found, video ID:", videoId);
            setTrailerUrl(
              `https://www.youtube.com/embed/${videoId}?autoplay=0`
            );
          } else {
            console.log("No trailer found for:", response.data.Title);
            // Try alternative search terms
            const altSearchResponse = await axios.get(
              getYoutubeApiUrl(
                `part=snippet&q=${encodeURIComponent(
                  response.data.Title + " movie trailer"
                )}&key=${YOUTUBE_API_KEY}&type=video&maxResults=1`
              )
            );

            if (
              altSearchResponse.data.items &&
              altSearchResponse.data.items.length > 0
            ) {
              const videoId = altSearchResponse.data.items[0].id.videoId;
              console.log(
                "Trailer found with alternative search, video ID:",
                videoId
              );
              setTrailerUrl(
                `https://www.youtube.com/embed/${videoId}?autoplay=0`
              );
            } else {
              console.log("No trailer found with alternative search");
              setTrailerUrl("");
            }
          }
        } catch (trailerErr) {
          console.error("Error fetching trailer:", trailerErr);
          if (axios.isAxiosError(trailerErr)) {
            console.error(
              "YouTube API error details:",
              trailerErr.response?.data
            );
          }
          setTrailerUrl("");
        }

        setShowModal(true);
      }
    } catch (err) {
      console.error("Error fetching movie details:", err);
      if (axios.isAxiosError(err)) {
        console.error("OMDB API error details:", err.response?.data);
      }
      setError("Failed to fetch movie details. Please try again later.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMovie(null);
    setTrailerUrl("");
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const searchResponse = await axios.get(
        getOmdbApiUrl(
          `apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`
        )
      );

      if (
        searchResponse.data.Response === "True" &&
        searchResponse.data.Search
      ) {
        const movies = searchResponse.data.Search;
        const movieDetailsPromises = movies.map(async (movie: Movie) => {
          try {
            const detailResponse = await axios.get(
              getOmdbApiUrl(
                `apikey=${OMDB_API_KEY}&i=${movie.imdbID}&plot=short`
              )
            );
            return detailResponse.data;
          } catch (detailErr) {
            console.error("Error fetching movie details:", detailErr);
            return null;
          }
        });

        const movieDetails = (await Promise.all(movieDetailsPromises)).filter(
          Boolean
        );
        setSearchResults(movieDetails);
      } else {
        setSearchResults([]);
        setError(searchResponse.data.Error || "No movies found");
      }
    } catch (err) {
      console.error("Error searching movies:", err);
      setError("Failed to search movies. Please try again later.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-primary-color">
        <Navbar onSearch={handleSearch} />
        <div className="container mx-auto px-4 py-8">
          {/* Genre Filter */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Filter by Genre
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGenre("All")}
                className={`px-4 py-2 rounded-full ${
                  selectedGenre === "All"
                    ? "bg-accent-color text-white"
                    : "bg-secondary-color text-gray-300 hover:bg-gray-700"
                }`}
              >
                All
              </button>
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 rounded-full ${
                    selectedGenre === genre
                      ? "bg-accent-color text-white"
                      : "bg-secondary-color text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="text-white text-xl">Searching...</div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                Search Results
              </h2>
              <MovieGrid
                movies={searchResults}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onMovieClick={handleMovieClick}
              />
            </div>
          )}

          {/* Trending Movies Section */}
          {!isSearching && searchResults.length === 0 && (
            <>
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Trending Now
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {trendingMovies.map((movie) => (
                    <div
                      key={movie.imdbID}
                      className="bg-secondary-color rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 cursor-pointer"
                      onClick={() => handleMovieClick(movie.imdbID)}
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
                            handleToggleFavorite(movie.imdbID);
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
                            <span className="ml-1 text-gray-300">
                              {movie.imdbRating}
                            </span>
                          </div>
                          <span className="text-gray-400">{movie.Year}</span>
                        </div>
                        {movie.Genre && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-400">
                              {movie.Genre}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regular Movies Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Popular Movies
                </h2>
                <MovieGrid
                  movies={filteredMovies}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onMovieClick={handleMovieClick}
                />
              </div>
            </>
          )}

          {error && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-8">
              <p className="text-red-500 text-xl">{error}</p>
            </div>
          )}
        </div>

        {/* Movie Details Modal */}
        {showModal && selectedMovie && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary-color rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-white hover:text-gray-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <img
                        src={
                          selectedMovie.Poster !== "N/A"
                            ? selectedMovie.Poster
                            : "https://via.placeholder.com/300x450?text=No+Poster"
                        }
                        alt={selectedMovie.Title}
                        className="w-full rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="md:w-2/3">
                      <h2 className="text-3xl font-bold text-white mb-4">
                        {selectedMovie.Title}
                      </h2>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-yellow-400">
                          ★ {selectedMovie.imdbRating}
                        </span>
                        <span className="text-gray-400">
                          {selectedMovie.Year}
                        </span>
                        <span className="text-gray-400">
                          {selectedMovie.Runtime}
                        </span>
                      </div>
                      {selectedMovie.Genre && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedMovie.Genre.split(", ").map((genre) => (
                            <span
                              key={genre}
                              className="px-3 py-1 bg-accent-color rounded-full text-sm text-white"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Trailer Section */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Trailer
                        </h3>
                        {trailerUrl ? (
                          <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
                            <iframe
                              src={trailerUrl}
                              className="absolute top-0 left-0 w-full h-full"
                              title={`${selectedMovie.Title} Trailer`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        ) : (
                          <div className="bg-gray-800 rounded-lg p-6 text-center">
                            <p className="text-gray-400 mb-2">
                              No trailer available for this movie.
                            </p>
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                selectedMovie.Title + " official trailer"
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-color hover:underline"
                            >
                              Search for trailer on YouTube
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {selectedMovie.Plot && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Plot
                            </h3>
                            <p className="text-gray-300">
                              {selectedMovie.Plot}
                            </p>
                          </div>
                        )}
                        {selectedMovie.Director && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Director
                            </h3>
                            <p className="text-gray-300">
                              {selectedMovie.Director}
                            </p>
                          </div>
                        )}
                        {selectedMovie.Writer && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Writer
                            </h3>
                            <p className="text-gray-300">
                              {selectedMovie.Writer}
                            </p>
                          </div>
                        )}
                        {selectedMovie.Actors && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Cast
                            </h3>
                            <p className="text-gray-300">
                              {selectedMovie.Actors}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {selectedMovie.Language && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">
                                Language
                              </h3>
                              <p className="text-gray-300">
                                {selectedMovie.Language}
                              </p>
                            </div>
                          )}
                          {selectedMovie.Country && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">
                                Country
                              </h3>
                              <p className="text-gray-300">
                                {selectedMovie.Country}
                              </p>
                            </div>
                          )}
                          {selectedMovie.Awards && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">
                                Awards
                              </h3>
                              <p className="text-gray-300">
                                {selectedMovie.Awards}
                              </p>
                            </div>
                          )}
                          {selectedMovie.BoxOffice && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">
                                Box Office
                              </h3>
                              <p className="text-gray-300">
                                {selectedMovie.BoxOffice}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route
            path="/favorites"
            element={
              <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Your Favorites
                </h2>
                <MovieGrid
                  movies={[...movies, ...trendingMovies].filter((movie) =>
                    favorites.includes(movie.imdbID)
                  )}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onMovieClick={handleMovieClick}
                />
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
