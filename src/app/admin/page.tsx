'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !releaseYear || !posterUrl) {
      setMessage("Please fill all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          movie: {
            id: Date.now().toString(),
            title,
            description,
            releaseYear,
            posterUrl,
          }
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage("Movie added successfully!");
        // Reset form
        setTitle("");
        setDescription("");
        setReleaseYear("");
        setPosterUrl("");
        // Refresh the movies list
        router.refresh();
      } else {
        setMessage("Error: " + (data.error || "Failed to add movie"));
      }
    } catch (error) {
      console.error('Error adding movie:', error);
      setMessage("Error adding movie. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="max-w-md mx-auto p-6 bg-[#18181B] rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Add a Movie</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white/70 mb-1">Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g., The Dark Knight"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 rounded bg-[#2D2D33] text-white border border-white/10 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white/70 mb-1">Description</label>
            <textarea
              id="description"
              placeholder="Movie description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 rounded bg-[#2D2D33] text-white border border-white/10 focus:border-blue-500 focus:outline-none"
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-white/70 mb-1">Release Year</label>
            <input
              id="year"
              type="text"
              placeholder="e.g., 2008"
              value={releaseYear}
              onChange={e => setReleaseYear(e.target.value)}
              className="w-full p-2 rounded bg-[#2D2D33] text-white border border-white/10 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="poster" className="block text-sm font-medium text-white/70 mb-1">Poster URL</label>
            <input
              id="poster"
              type="text"
              placeholder="https://..."
              value={posterUrl}
              onChange={e => setPosterUrl(e.target.value)}
              className="w-full p-2 rounded bg-[#2D2D33] text-white border border-white/10 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            className={`mt-2 bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Adding Movie...' : 'Add Movie'}
          </button>
        </form>
        {message && (
          <div className={`mt-4 p-3 rounded ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
