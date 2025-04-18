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
  const url = isDevelopment
    ? `https://www.omdbapi.com/?${params}`
    : `/api/omdb/?${params}`;
  console.log(`OMDB API URL: ${url}`);
  return url;
};

// Helper function to get the YouTube API URL
const getYoutubeApiUrl = (params: string) => {
  const url = isDevelopment
    ? `https://www.googleapis.com/youtube/v3/search?${params}`
    : `/api/youtube/search?${params}`;
  console.log(`YouTube API URL: ${url}`);
  return url;
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

const FALLBACK_MOVIES = [
  {
    imdbID: "tt0111161",
    Title: "The Shawshank Redemption",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg",
    Year: "1994",
    imdbRating: "9.3",
    Genre: "Drama",
    Plot: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    Director: "Frank Darabont",
    Actors: "Tim Robbins, Morgan Freeman",
    Runtime: "142 min",
  },
  {
    imdbID: "tt0110912",
    Title: "Pulp Fiction",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    Year: "1994",
    imdbRating: "8.9",
    Genre: "Crime, Drama",
    Plot: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    Director: "Quentin Tarantino",
    Actors: "John Travolta, Uma Thurman",
    Runtime: "154 min",
  },
  {
    imdbID: "tt0068646",
    Title: "The Godfather",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    Year: "1972",
    imdbRating: "9.2",
    Genre: "Crime, Drama",
    Plot: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    Director: "Francis Ford Coppola",
    Actors: "Marlon Brando, Al Pacino",
    Runtime: "175 min",
  },
];

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
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      setApiError(false);

      console.log("Environment mode:", import.meta.env.MODE);
      console.log("API keys available:", {
        omdb: !!OMDB_API_KEY,
        youtube: !!YOUTUBE_API_KEY,
      });

      try {
        // Fetch trending movies
        console.log("Fetching trending movies...");
        const popularSearchTerms = [
          "avengers",
          "inception",
          "interstellar",
          "joker",
          "dune",
        ];

        const trendingPromises = popularSearchTerms.map((term: string) =>
          fetch(
            getOmdbApiUrl(
              `apikey=${OMDB_API_KEY}&s=${encodeURIComponent(term)}`
            )
          )
            .then((res) => {
              console.log(`Response status for ${term}:`, res.status);
              return res.json();
            })
            .then((data) => {
              console.log(`Data for ${term}:`, data);
              if (
                data.Response === "True" &&
                data.Search &&
                data.Search.length > 0
              ) {
                return data.Search[0];
              }
              return null;
            })
            .catch((err) => {
              console.error(`Error fetching trending movie for ${term}:`, err);
              return null;
            })
        );

        const trendingResults = await Promise.all(trendingPromises);
        console.log("Trending results:", trendingResults);
        const validTrendingResults = trendingResults.filter(
          (result) => result !== null
        );

        if (validTrendingResults.length > 0) {
          setTrendingMovies(validTrendingResults);
        } else {
          // Use fallback data if no trending movies found
          console.log("Using fallback data for trending movies");
          setTrendingMovies(FALLBACK_MOVIES);
          setApiError(true);
        }

        // Fetch regular movies
        console.log("Fetching regular movies for genre:", selectedGenre);
        const response = await fetch(
          getOmdbApiUrl(
            `apikey=${OMDB_API_KEY}&s=${encodeURIComponent(selectedGenre)}`
          )
        );
        console.log("Regular movies response status:", response.status);
        const data = await response.json();
        console.log("Regular movies data:", data);

        if (data.Response === "True" && data.Search) {
          setMovies(data.Search);
        } else {
          // Use fallback data if no movies found
          console.log("Using fallback data for regular movies");
          setMovies(FALLBACK_MOVIES);
          setApiError(true);
        }
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError("Failed to fetch movies. Please try again later.");
        setApiError(true);

        // Use fallback data on error
        console.log("Using fallback data due to error");
        setMovies(FALLBACK_MOVIES);
        setTrendingMovies(FALLBACK_MOVIES);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [selectedGenre as string]);

  useEffect(() => {
    if (selectedGenre === "All") {
      setFilteredMovies(movies);
    } else {
      const filtered = movies.filter((movie: MovieDetails) =>
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

  // Directly use apiError in a way TypeScript will recognize
  const apiStatus = apiError ? "Using fallback data" : "Connected to API";
  console.log("API Status:", apiStatus);

  return (
    <Router>
      <div className="min-h-screen bg-primary-color">
        <Navbar onSearch={handleSearch} />
        <div className="container mx-auto px-4 py-8">
          {/* API Error Banner */}
          {apiError && (
            <div className="bg-yellow-800 text-white p-4 mb-4 rounded-lg">
              <p className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {apiStatus}
              </p>
            </div>
          )}

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
