import { NextRequest } from "next/server";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "~/constants/voteContract";
import { createPublicClient, http, getContract } from "viem";
import { celo } from "viem/chains";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing smart contract connection...");
    
    // Create a public client for reading from the contract
    const publicClient = createPublicClient({
      chain: celo,
      transport: http()
    });

    // Get the contract instance
    const contract = getContract({
      address: VOTE_CONTRACT_ADDRESS,
      abi: VOTE_CONTRACT_ABI,
      publicClient
    });

    // Read the movie count from the contract
    const movieCount = await contract.read.movieCount();
    console.log("Movie count on contract:", movieCount.toString());

    // Get details for each movie that exists on the contract
    const contractMovies = [];
    for (let i = 0; i < Number(movieCount); i++) {
      try {
        const movie = await contract.read.movies([BigInt(i)]);
        const votes = await contract.read.getVotes([BigInt(i)]);
        
        contractMovies.push({
          id: i,
          contractId: movie[0].toString(),
          title: movie[1],
          yesVotes: movie[2].toString(),
          noVotes: movie[3].toString(),
          getVotesYes: votes[0].toString(),
          getVotesNo: votes[1].toString()
        });
      } catch (error) {
        console.error(`Error reading movie ${i}:`, error);
        contractMovies.push({
          id: i,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return Response.json({ 
      success: true, 
      contractAddress: VOTE_CONTRACT_ADDRESS,
      chainId: celo.id,
      chainName: celo.name,
      movieCount: movieCount.toString(),
      contractMovies,
      message: "Smart contract test completed"
    });
    
  } catch (error) {
    console.error("Smart contract test failed:", error);
    
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
