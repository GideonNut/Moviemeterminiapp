'use client';

import { useState } from "react";

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !releaseYear || !posterUrl) {
      setMessage("Please fill all fields.");
      return;
    }
    await fetch("/api/movie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: Date.now().toString(),
        title,
        description,
        releaseYear,
        posterUrl,
      }),
    });
    setMessage("Movie added!");
    setTitle("");
    setDescription("");
    setReleaseYear("");
    setPosterUrl("");
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Add a Movie</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="p-2 rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="p-2 rounded"
        />
        <input
          type="text"
          placeholder="Release Year"
          value={releaseYear}
          onChange={e => setReleaseYear(e.target.value)}
          className="p-2 rounded"
        />
        <input
          type="text"
          placeholder="Poster URL"
          value={posterUrl}
          onChange={e => setPosterUrl(e.target.value)}
          className="p-2 rounded"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">Add Movie</button>
      </form>
      {message && <p className="mt-4 text-green-400">{message}</p>}
    </div>
  );
}
