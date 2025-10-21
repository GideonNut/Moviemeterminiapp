import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, title, titles } = body || {};

    if (action !== "addMovie" && action !== "addMovies") {
      return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const isBatch = action === "addMovies";
    if (isBatch) {
      if (!Array.isArray(titles) || titles.length === 0 || titles.some((t: unknown) => typeof t !== 'string' || !t.trim())) {
        return Response.json({ success: false, error: "Missing or invalid titles array" }, { status: 400 });
      }
    } else {
      if (typeof title !== "string" || !title.trim()) {
        return Response.json({ success: false, error: "Missing or invalid title" }, { status: 400 });
      }
    }

    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    const fromAddress = process.env.THIRDWEB_FROM_ADDRESS;
    const vaultAccessToken = process.env.THIRDWEB_VAULT_ACCESS_TOKEN;
    const walletAccessToken = process.env.THIRDWEB_WALLET_ACCESS_TOKEN;
    const contractAddress = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS || process.env.VOTE_CONTRACT_ADDRESS;
    const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 42220);

    if (!secretKey) {
      return Response.json({ success: false, error: "Server missing THIRDWEB_SECRET_KEY" }, { status: 500 });
    }
    if (!fromAddress) {
      return Response.json({ success: false, error: "Server missing THIRDWEB_FROM_ADDRESS" }, { status: 500 });
    }
    if (!contractAddress) {
      return Response.json({ success: false, error: "Server missing VOTE_CONTRACT_ADDRESS" }, { status: 500 });
    }

    // Build headers dynamically based on available tokens
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-secret-key": secretKey,
    };

    // Add authentication token (prefer vault, fallback to wallet)
    if (vaultAccessToken) {
      headers["x-vault-access-token"] = vaultAccessToken;
    } else if (walletAccessToken) {
      headers["x-wallet-access-token"] = walletAccessToken;
    } else {
      return Response.json({ 
        success: false, 
        error: "Server missing THIRDWEB_VAULT_ACCESS_TOKEN or THIRDWEB_WALLET_ACCESS_TOKEN" 
      }, { status: 500 });
    }

    const thirdwebResponse = await fetch("https://api.thirdweb.com/v1/contracts/write", {
      method: "POST",
      headers,
      body: JSON.stringify({
        calls: isBatch
          ? (titles as string[]).map((t) => ({
              contractAddress,
              method: "function addMovie(string _title)",
              params: [t.trim()],
            }))
          : [
              {
                contractAddress,
                method: "function addMovie(string _title)",
                params: [title.trim()],
              },
            ],
        chainId,
        from: fromAddress,
      }),
    });

    const data = await thirdwebResponse.json().catch(() => ({}));

    if (!thirdwebResponse.ok) {
      const message = data?.error || data?.message || "Thirdweb request failed";
      return Response.json({ success: false, error: message, details: data }, { status: thirdwebResponse.status });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}


