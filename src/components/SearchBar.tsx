"use client";
import { Input } from "~/components/ui/input";
import { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search movies or genres..." 
}: SearchBarProps) {
  const [search, setSearch] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch?.(value);
  };

  return (
    <div className="flex justify-center">
      <Input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={handleChange}
        className="w-full max-w-md text-sm"
      />
    </div>
  );
}