import { NextRequest } from "next/server";
import { getAllMovies } from "~/lib/firestore";
import { updateMovieContractId } from "~/lib/firestore";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { createPublicClient, http, getContract, createWalletClient, parseEther } from "viem";
import { celo } from "viem/chains";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, privateKey } = body;

    if (action !== "sync") {
      return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    if (!privateKey) {
      return Response.json({ 
        success: false, 
        error: "Private key required for contract interaction" 
      }, { status: 400 });
    }

    console.log("Starting contract sync...");

    // Create clients for contract interaction
    const publicClient = createPublicClient({
      chain: celo,
      transport: http()
    });

    const walletClient = createWalletClient({
      chain: celo,
      transport: http(),
      account: privateKey as `0x${string}`
    });

    // Get the contract instance for reading
    const readContract = getContract({
      address: VOTE_CONTRACT_ADDRESS,
      abi: VOTE_CONTRACT_ABI,
      client: publicClient
    });

    // Get the contract instance for writing
    const writeContract = getContract({
      address: VOTE_CONTRACT_ADDRESS,
      abi: VOTE_CONTRACT_ABI,
      client: walletClient
    });

    // Get current movie count on contract
    const currentMovieCount = await readContract.read.movieCount();
    console.log("Current movie count on contract:", currentMovieCount.toString());

    // Get all movies from database
    const dbMovies = await getAllMovies();
    console.log(`Found ${dbMovies.length} movies in database`);

    // Filter movies that need to be added (those without a contractId or with contractId >= current contract count)
    const moviesToAdd = dbMovies.filter(movie => {
      // If movie already has a contractId, skip it
      if (movie.contractId) {
        return false;
      }
      // Otherwise, check if it should be added based on sequential logic
      // For now, add all movies without contractId
      return true;
    });

    console.log(`${moviesToAdd.length} movies need to be added to contract`);

    if (moviesToAdd.length === 0) {
      return Response.json({ 
        success: true, 
        message: "All movies are already synced to the contract",
        currentContractCount: currentMovieCount.toString(),
        dbCount: dbMovies.length
      });
    }

    // Add movies to contract
    let addedCount = 0;
    const errors: string[] = [];
    let currentContractId = Number(currentMovieCount);

    for (const movie of moviesToAdd) {
      try {
        console.log(`Adding movie "${movie.title}" (TMDB ID: ${movie.tmdbId || movie.id}) to contract...`);
        
        // The contract ID will be the current movieCount (before adding)
        const contractId = currentContractId;
        console.log(`Movie will be assigned contract ID: ${contractId}`);
        
        // Add movie to contract
        const hash = await writeContract.write.addMovie([movie.title]);
        console.log(`Transaction hash for "${movie.title}":`, hash);
        
        // Wait for transaction to be mined
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`Movie "${movie.title}" successfully added to contract with ID: ${contractId}`);
        
        // Update Firestore with the contract ID
        try {
          const tmdbId = movie.tmdbId || movie.id;
          await updateMovieContractId(tmdbId, contractId.toString());
          console.log(`Updated Firestore with contract ID ${contractId} for movie ${tmdbId}`);
        } catch (updateError) {
          console.error(`Failed to update Firestore with contract ID for "${movie.title}":`, updateError);
          // Don't fail the whole sync if Firestore update fails
          errors.push(`${movie.title}: Added to contract but failed to update Firestore`);
        }
        
        addedCount++;
        currentContractId++; // Increment for next movie
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to add movie "${movie.title}":`, errorMsg);
        errors.push(`${movie.title}: ${errorMsg}`);
      }
    }

    // Get updated movie count
    const newMovieCount = await readContract.read.movieCount();

    return Response.json({ 
      success: true, 
      message: `Contract sync completed`,
      addedCount,
      errors,
      previousContractCount: currentMovieCount.toString(),
      newContractCount: newMovieCount.toString(),
      totalDbMovies: dbMovies.length
    });
    
  } catch (error) {
    console.error("Contract sync failed:", error);
    
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
