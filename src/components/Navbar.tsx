import { Link } from "react-router-dom";
import { MagnifyingGlassIcon, FilmIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface NavbarProps {
  onSearch: (query: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <nav className="bg-gradient-to-r from-secondary-color to-primary-color py-4 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="group flex items-center space-x-3">
            <FilmIcon className="h-8 w-8 text-accent-color transform group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-3xl font-bold">
              <span className="text-accent-color group-hover:text-white transition-colors duration-300">
                RITHA'S
              </span>
              <span className="text-white group-hover:text-accent-color transition-colors duration-300">
                {" "}
                MOVIES
              </span>
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="bg-primary-color/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-color w-64 transition-all duration-300 group-hover:w-72"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-hover:text-accent-color transition-colors duration-300" />
              </button>
            </form>

            <Link
              to="/favorites"
              className="relative group text-gray-300 hover:text-white transition-colors duration-300"
            >
              <span className="relative z-10">Favorites</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-color transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
