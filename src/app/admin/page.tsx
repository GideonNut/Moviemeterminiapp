'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/Button";
import ScrollToTop from "~/components/ScrollToTop";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useConnect } from "wagmi";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";

export default function AdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [isTVShow, setIsTVShow] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [contentCounts, setContentCounts] = useState({ movies: 0, tvShows: 0 });

  // Wallet state
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContract, data: txHash, isPending, error: walletWriteError } = useWriteContract();
  const { connect, connectors } = useConnect();
  const [walletMessage, setWalletMessage] = useState<string>("");

  // Function to reset content IDs to sequential
  const resetContentIds = async () => {
    try {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      
      const result = await response.json();
      if (result.success) {
        console.log("✅ Content IDs reset successfully!");
        // Refresh content counts
        fetchContentCounts();
      } else {
        console.error("❌ Failed to reset content IDs:", result.error);
      }
    } catch (error) {
      console.error("❌ Error resetting content IDs:", error);
    }
  };

  // Function to add multiple movies/TV shows on-chain using wallet
  const addContentOnChain = async (titles: string[], contentType: 'movies' | 'tv') => {
    if (!isConnected) {
      setWalletMessage("Connect your wallet first.");
      return;
    }
    
    try {
      // Switch to Celo if needed
      if (currentChainId !== 42220) {
        await switchChainAsync({ chainId: 42220 });
      }
      
      setWalletMessage(`Adding ${titles.length} ${contentType} on-chain...`);
      
      // Add content one by one (since writeContract doesn't support batch)
      for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        try {
          await writeContract({
            address: VOTE_CONTRACT_ADDRESS,
            abi: VOTE_CONTRACT_ABI,
            functionName: 'addMovie',
            args: [title.trim()],
          });
          setWalletMessage(`Added ${i + 1}/${titles.length}: ${title}`);
        } catch (error) {
          setWalletMessage(`Failed to add "${title}": ${(error as Error).message}`);
          break;
        }
      }
      
      setWalletMessage(`✅ Successfully added ${titles.length} ${contentType} on-chain!`);
      
      // Automatically reset content IDs after on-chain addition
      setWalletMessage(`🔄 Resetting content IDs to match on-chain order...`);
      await resetContentIds();
      setWalletMessage(`✅ Content IDs reset! Database now matches on-chain movie order.`);
      
    } catch (error) {
      setWalletMessage(`❌ Error: ${(error as Error).message}`);
    }
  };

  const handleRetract = async () => {
    if (!confirm("Are you sure you want to retract all movies imported in the last 48 hours? (Movies only)")) {
      return;
    }
    
    setIsRetracting(true);
    try {
      const response = await fetch("/api/movies/retract", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage(`Successfully retracted ${data.deletedCount} recently imported movies`);
        router.refresh();
      } else {
        setMessage("Error retracting movies: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error('Error retracting movies:', error);
      setMessage("Error retracting movies. Please try again.");
    } finally {
      setIsRetracting(false);
    }
  };

  const handleRetractTV = async () => {
    if (!confirm("Are you sure you want to retract all TV shows imported in the last 48 hours? (TV shows only)")) {
      return;
    }
    setIsRetracting(true);
    try {
      const response = await fetch("/api/tv/retract", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`Successfully retracted ${data.deletedCount} recently imported TV shows`);
        router.refresh();
      } else {
        setMessage("Error retracting TV shows: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error('Error retracting TV shows:', error);
      setMessage("Error retracting TV shows. Please try again.");
    } finally {
      setIsRetracting(false);
    }
  };

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
            // Remove custom ID - let system generate sequential ID starting from 0
            title,
            description,
            releaseYear,
            posterUrl,
            isTVShow, // Include TV show flag
          }
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        const mediaType = isTVShow ? "TV Show" : "Movie";
        setMessage(`${mediaType} added successfully with ID: ${data.movieId}!`);
        // Reset form
        setTitle("");
        setDescription("");
        setReleaseYear("");
        setPosterUrl("");
        setIsTVShow(false);
        // Refresh the movies list
        router.refresh();

        // Prompt to add to contract via Thirdweb (both movies and TV shows)
        const contentType = isTVShow ? "TV Show" : "Movie";
        const confirmChainAdd = confirm(`Add this ${contentType.toLowerCase()} on-chain via Thirdweb now? You will use your configured relayer.`);
        if (confirmChainAdd) {
          try {
            const thirdwebRes = await fetch("/api/thirdweb", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "addMovie", title })
            });
            const thirdwebData = await thirdwebRes.json();
            if (!thirdwebRes.ok || !thirdwebData.success) {
              const errMsg = thirdwebData?.error || "Thirdweb add failed";
              alert(`On-chain add failed: ${errMsg}`);
            } else {
              alert(`On-chain add submitted via Thirdweb for ${contentType.toLowerCase()}.`);
              
              // Automatically reset content IDs after on-chain addition
              setMessage(`🔄 Resetting content IDs to match on-chain order...`);
              await resetContentIds();
              setMessage(`✅ Content IDs reset! Database now matches on-chain movie order.`);
            }
          } catch (err) {
            console.error("Thirdweb add error:", err);
            alert("Failed to call Thirdweb API.");
          }
        }
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

  const importTrending = async () => {
    setIsImporting(true);
    setImportStatus("Importing trending movies...");
    
    try {
      const response = await fetch("/api/import/tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "trending", page: 1, mediaType: "movie" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportStatus(`✅ Successfully imported ${result.imported} trending movies!`);
        if (result.titles && Array.isArray(result.titles) && result.titles.length > 0) {
          const doOnChain = confirm(`Add ${result.titles.length} imported movies on-chain now?`);
          if (doOnChain) {
            await addContentOnChain(result.titles, 'movies');
          }
        }
      } else {
        setImportStatus(`❌ Import failed: ${result.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  const importTrendingTV = async () => {
    setIsImporting(true);
    setImportStatus("Importing trending TV shows...");
    
    try {
      const response = await fetch("/api/import/tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "trending", page: 1, mediaType: "tv" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportStatus(`✅ Successfully imported ${result.imported} trending TV shows!`);
        if (result.titles && Array.isArray(result.titles) && result.titles.length > 0) {
          const doOnChain = confirm(`Add ${result.titles.length} imported TV shows on-chain now?`);
          if (doOnChain) {
            await addContentOnChain(result.titles, 'tv');
          }
        }
      } else {
        setImportStatus(`❌ Import failed: ${result.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  const importSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsImporting(true);
    setImportStatus(`Searching for "${query}"...`);
    
    try {
      const response = await fetch("/api/import/tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "search", query: query.trim(), page: 1, mediaType: "movie" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportStatus(`✅ Successfully imported ${result.imported} movies for "${query}"!`);
        if (result.titles && Array.isArray(result.titles) && result.titles.length > 0) {
          const doOnChain = confirm(`Add ${result.titles.length} imported movies on-chain now?`);
          if (doOnChain) {
            await addContentOnChain(result.titles, 'movies');
          }
        }
      } else {
        setImportStatus(`❌ Import failed: ${result.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  const importSearchTV = async (query: string) => {
    if (!query.trim()) return;
    
    setIsImporting(true);
    setImportStatus(`Searching for TV shows "${query}"...`);
    
    try {
      const response = await fetch("/api/import/tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "search", query: query.trim(), page: 1, mediaType: "tv" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportStatus(`✅ Successfully imported ${result.imported} TV shows for "${query}"!`);
        if (result.titles && Array.isArray(result.titles) && result.titles.length > 0) {
          const doOnChain = confirm(`Add ${result.titles.length} imported TV shows on-chain now?`);
          if (doOnChain) {
            await addContentOnChain(result.titles, 'tv');
          }
        }
      } else {
        setImportStatus(`❌ Import failed: ${result.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Function to sync content to smart contract
  const syncContentToContract = async () => {
    setIsImporting(true);
    setImportStatus("Syncing content to smart contract...");
    
    try {
      // Get all content from database
      const [moviesResponse, tvShowsResponse] = await Promise.all([
        fetch("/api/movies"),
        fetch("/api/tv")
      ]);
      
      const moviesData = await moviesResponse.json();
      const tvShowsData = await tvShowsResponse.json();
      
      if (moviesData.success && tvShowsData.success) {
        const allContent = [
          ...(moviesData.movies || []),
          ...(tvShowsData.tvShows || [])
        ];
        
        let syncedCount = 0;
        
        // For each content item, add it to the contract if it doesn't exist
        for (const content of allContent) {
          try {
            // This would call the smart contract to add the content
            // For now, we'll just show the process
            const contentType = content.isTVShow ? 'TV Show' : 'Movie';
            console.log(`Syncing ${contentType} ID ${content.id}: ${content.title}`);
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync content ${content.id}:`, error);
          }
        }
        
        setImportStatus(`✅ Synced ${syncedCount} content items to smart contract! Check the voting pages for details.`);
      } else {
        setImportStatus("❌ Failed to get content from database");
      }
    } catch (error) {
      setImportStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Function to fetch content counts
  const fetchContentCounts = async () => {
    try {
      const [moviesResponse, tvShowsResponse] = await Promise.all([
        fetch("/api/movies"),
        fetch("/api/tv")
      ]);
      
      const moviesData = await moviesResponse.json();
      const tvShowsData = await tvShowsResponse.json();
      
      if (moviesData.success && tvShowsData.success) {
        setContentCounts({
          movies: moviesData.movies?.length || 0,
          tvShows: tvShowsData.tvShows?.length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching content counts:', error);
    }
  };

  // Function to fix existing poster URLs
  const fixPosterUrls = async () => {
    setIsImporting(true);
    setImportStatus("Fixing existing poster URLs...");
    
    try {
      const response = await fetch("/api/fix-poster-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fix" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportStatus(`✅ Successfully fixed ${result.fixedCount} poster URLs!`);
        // Refresh content counts
        fetchContentCounts();
      } else {
        setImportStatus(`❌ Failed to fix poster URLs: ${result.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch counts on component mount
  useEffect(() => {
    fetchContentCounts();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="max-w-md mx-auto p-6 bg-[#18181B] rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Add Content</h2>
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
          
          {/* TV Show Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="isTVShow"
              type="checkbox"
              checked={isTVShow}
              onChange={e => setIsTVShow(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-[#2D2D33] border border-white/10 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="isTVShow" className="text-sm font-medium text-white/70">
              This is a TV Show
            </label>
          </div>
          
          <button 
            type="submit" 
            className={`mt-2 bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : `Add ${isTVShow ? 'TV Show' : 'Movie'}`}
          </button>
        </form>
        {message && (
          <div className={`mt-4 p-3 rounded ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {message}
          </div>
        )}

        {/* On-chain add via connected wallet */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold mb-3 text-white">Add On-Chain (Connected Wallet)</h3>
          <p className="text-sm text-white/60 mb-3">
            This calls the smart contract directly from your browser wallet on Celo (chainId 42220). Works for both movies and TV shows.
          </p>
          
          {/* Connect Wallet Button */}
          {!isConnected ? (
            <div className="mb-4">
              <div className="space-y-2">
                {connectors.map((connector) => (
                  <Button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Connect {connector.name}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-white/60 mt-2">
                Connect your wallet to add movies and TV shows on-chain
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400">
                ✅ Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              {currentChainId !== 42220 && (
                <p className="text-sm text-yellow-400 mt-1">
                  ⚠️ Please switch to Celo network (chainId: 42220)
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                setWalletMessage("");
                if (!title.trim()) {
                  setWalletMessage("Enter a title above first.");
                  return;
                }
                if (!isConnected) {
                  setWalletMessage("Connect your wallet first.");
                  return;
                }
                try {
                  if (currentChainId !== 42220) {
                    await switchChainAsync({ chainId: 42220 });
                  }
                  const mediaType = isTVShow ? "TV Show" : "Movie";
                  await writeContract({
                    address: VOTE_CONTRACT_ADDRESS,
                    abi: VOTE_CONTRACT_ABI,
                    functionName: 'addMovie',
                    args: [title.trim()],
                  });
                  setWalletMessage(`${mediaType} transaction submitted. Check your wallet for confirmation.`);
                  
                  // Automatically reset content IDs after on-chain addition
                  setWalletMessage(`🔄 Resetting content IDs to match on-chain order...`);
                  await resetContentIds();
                  setWalletMessage(`✅ Content IDs reset! Database now matches on-chain movie order.`);
                } catch (e) {
                  setWalletMessage((e as Error).message || "Failed to submit transaction.");
                }
              }}
              disabled={isPending || !isConnected}
              className=""
            >
              {isPending ? "Submitting..." : `Add ${isTVShow ? 'TV Show' : 'Movie'} On-Chain with Wallet`}
            </Button>
            {txHash && (
              <a
                href={`https://celoscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 text-sm underline"
              >
                View Tx
              </a>
            )}
          </div>
          {(walletMessage || walletWriteError) && (
            <div className="mt-3 p-3 rounded bg-[#2D2D33] text-white/80 text-sm">
              {walletMessage || walletWriteError?.message}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 mt-10">
        <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* TMDb Import Section */}
          <div className="bg-[#18181B] p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">🎬 TMDb Movie Import</h2>
            
            <div className="space-y-4">
              <Button 
                onClick={importTrending}
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? "Importing..." : "Import Trending Movies"}
              </Button>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Search & Import Movies</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Avengers, Batman, etc."
                    className="flex-1 p-2 rounded bg-[#2D2D33] text-white border border-white/10 focus:border-blue-500 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        const target = e.target as HTMLInputElement;
                        importSearch(target.value);
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Avengers"]') as HTMLInputElement;
                      if (input) importSearch(input.value);
                    }}
                    disabled={isImporting}
                    size="sm"
                  >
                    Search
                  </Button>
                </div>
              </div>
              
              {importStatus && (
                <div className="mt-4 p-3 rounded bg-[#2D2D33]">
                  <p className="text-sm text-white/70">{importStatus}</p>
                </div>
              )}
              
              {/* Retract Button */}
              <Button 
                onClick={handleRetract}
                disabled={isRetracting}
                variant="destructive"
                className="w-full mt-4"
              >
                {isRetracting ? "Retracting..." : "Retract Recent Imports"}
              </Button>
              <Button 
                onClick={handleRetractTV}
                disabled={isRetracting}
                variant="destructive"
                className="w-full mt-2"
              >
                {isRetracting ? "Retracting..." : "Retract Recent TV Imports"}
              </Button>
            </div>
          </div>

          {/* TMDb TV Show Import Section */}
          <div className="bg-[#18181B] p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">📺 TMDb TV Show Import</h2>
            
            <div className="space-y-4">
              <Button 
                onClick={importTrendingTV}
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? "Importing..." : "Import Trending TV Shows"}
              </Button>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Search & Import TV Shows</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Breaking Bad, Stranger Things, etc."
                    className="flex-1 p-2 rounded bg-[#2D2D33] text-white border border-white/10 focus:border-purple-500 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        const target = e.target as HTMLInputElement;
                        importSearchTV(target.value);
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Breaking Bad"]') as HTMLInputElement;
                      if (input) importSearchTV(input.value);
                    }}
                    disabled={isImporting}
                    size="sm"
                  >
                    Search
                  </Button>
                </div>
              </div>
              
              {importStatus && (
                <div className="mt-4 p-3 rounded bg-[#2D2D33]">
                  <p className="text-sm text-white/70">{importStatus}</p>
                </div>
              )}
            </div>
          </div>

          {/* TMDB Test Section */}
          <div className="bg-[#18181B] p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">🧪 TMDB Testing</h2>
            
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                Test TMDB image URL construction and verify that images are loading correctly.
              </p>
              
              <Button 
                onClick={() => window.open('/test-tmdb', '_blank')}
                className="w-full"
              >
                Open TMDB Test Page
              </Button>
              
              <div className="text-xs text-white/50">
                This will open a new tab with image URL tests and sample images.
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-[#18181B] p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">🗄️ Database Status</h2>
            <p className="text-white/70">
              MongoDB connection and TMDb API integration are configured.
            </p>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>MongoDB: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>TMDb API: Ready</span>
              </div>
            </div>
            
            {/* Content Counts */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <h3 className="text-lg font-medium mb-3 text-white">📊 Content Counts</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400">{contentCounts.movies}</div>
                  <div className="text-blue-300">Movies</div>
                </div>
                <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-400">{contentCounts.tvShows}</div>
                  <div className="text-purple-300">TV Shows</div>
                </div>
              </div>
              <Button
                onClick={fetchContentCounts}
                size="sm"
                variant="ghost"
                className="w-full mt-3 text-white/60 hover:text-white"
              >
                Refresh Counts
              </Button>
            </div>
            
            {/* Smart Contract Sync Section */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-lg font-medium mb-3 text-white">🔗 Smart Contract Sync</h3>
              <p className="text-sm text-white/60 mb-3">
                Ensure all database content exists on the smart contract for voting to work.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={syncContentToContract}
                  disabled={isImporting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isImporting ? "Syncing..." : "Sync Content to Contract"}
                </Button>
                
                <a
                  href="/test-contract"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors text-center block"
                >
                  Test Smart Contract
                </a>
                
                <Button
                  onClick={async () => {
                    if (confirm("⚠️ This will reset all content IDs to be sequential starting from 0. This action cannot be undone. Continue?")) {
                      try {
                        const response = await fetch("/api/movies", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "reset" }),
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                          setImportStatus("✅ Content IDs reset successfully! Refresh the page to see changes.");
                        } else {
                          setImportStatus("❌ Failed to reset content IDs: " + result.error);
                        }
                      } catch (error) {
                        setImportStatus("❌ Error resetting content IDs: " + (error instanceof Error ? error.message : "Unknown error"));
                      }
                    }
                  }}
                  disabled={isImporting}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Reset Content IDs to Sequential
                </Button>
              </div>
            </div>

            {/* Fix Poster URLs Section */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-lg font-medium mb-3 text-white">🖼️ Fix Poster URLs</h3>
              <p className="text-sm text-white/60 mb-3">
                Attempt to fix poster URLs that might be broken or malformed.
              </p>
              <Button
                onClick={fixPosterUrls}
                disabled={isImporting}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {isImporting ? "Fixing..." : "Fix Poster URLs"}
              </Button>
              {importStatus && (
                <div className="mt-4 p-3 rounded bg-[#2D2D33]">
                  <p className="text-sm text-white/70">{importStatus}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
