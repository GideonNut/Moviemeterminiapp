import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    const fromAddress = process.env.THIRDWEB_FROM_ADDRESS;
    const vaultAccessToken = process.env.THIRDWEB_VAULT_ACCESS_TOKEN;
    const contractAddress = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS || process.env.VOTE_CONTRACT_ADDRESS;
    const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 42220);

    // Test the API call with debug info
    const testResponse = await fetch("https://api.thirdweb.com/v1/contracts/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": secretKey || "",
        "x-vault-access-token": vaultAccessToken || "",
      },
      body: JSON.stringify({
        calls: [
          {
            contractAddress: contractAddress || "0x6d83eF793A7e82BFa20B57a60907F85c06fB8828",
            method: "function addMovie(string _title)",
            params: ["test-movie-debug"],
          },
        ],
        chainId,
        from: fromAddress || "",
      }),
    });

    const testData = await testResponse.json().catch(() => ({}));

    return Response.json({
      success: true,
      debug: {
        environment: {
          hasSecretKey: !!secretKey,
          hasFromAddress: !!fromAddress,
          hasVaultToken: !!vaultAccessToken,
          hasContractAddress: !!contractAddress,
          chainId,
          vaultTokenLength: vaultAccessToken?.length || 0,
          vaultTokenPrefix: vaultAccessToken?.substring(0, 10) || "none",
        },
        testRequest: {
          status: testResponse.status,
          ok: testResponse.ok,
          headers: Object.fromEntries(testResponse.headers.entries()),
          data: testData,
        },
      },
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
    }, { status: 500 });
  }
}
