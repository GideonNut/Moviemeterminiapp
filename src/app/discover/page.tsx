"use client";

import { Navigation } from "~/components/Navigation";
import { MovieCard } from "~/components/MovieCard";
import { useState, useEffect } from 'react';

const SAMPLE_MOVIES = [
  {
    id: "1",
    title: "Inception",
    description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    releaseYear: "2010",
    director: "Christopher Nolan",
    genres: ["Action", "Sci-Fi", "Thriller"],
    rating: 8.8,
    posterUrl: "https://example.com/inception.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  },
  {
    id: "2",
    title: "The Shawshank Redemption",
    description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    releaseYear: "1994",
    director: "Frank Darabont",
    genres: ["Drama"],
    rating: 9.3,
    posterUrl: "https://example.com/shawshank.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  },
  {
    id: "3",
    title: "The Dark Knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    releaseYear: "2008",
    director: "Christopher Nolan",
    genres: ["Action", "Crime", "Drama"],
    rating: 9.0,
    posterUrl: "https://example.com/dark-knight.jpg",
    voteCountYes: 0,
    voteCountNo: 0
  }
];

export default function DiscoverPage() {
  const [isVoting, setIsVoting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Add useEffect to handle connection state
  useEffect(() => {
    // Check if wallet is connected
    const checkConnection = async () => {
      try {
        // Add your wallet connection check logic here
        const connected = false; // Replace with actual check
        setIsConnected(connected);
      } catch (error) {
        console.error('Error checking connection:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleVote = async (movieId: string, vote: 'yes' | 'no') => {
    setIsVoting(true);
    try {
      // Add voting logic here
      console.log(`Voting ${vote} for movie ${movieId}`);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navigation />
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_MOVIES.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onVote={(vote) => handleVote(movie.id, vote ? 'yes' : 'no')}
                isVoting={isVoting}
                isConnected={isConnected}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}