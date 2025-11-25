import { AuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { createAppClient, viemConnector } from "@farcaster/auth-client";

declare module "next-auth" {
  interface Session {
    user: {
      fid: number;
      email?: string;
      name?: string;
      image?: string;
      address?: string;
    };
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    address?: string | null;
  }
}

function getDomainFromUrl(urlString: string | undefined): string {
  if (!urlString) {
    console.warn('NEXTAUTH_URL is not set, using localhost:3000 as fallback');
    return 'localhost:3000';
  }
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    console.error('Invalid NEXTAUTH_URL:', urlString, error);
    console.warn('Using localhost:3000 as fallback');
    return 'localhost:3000';
  }
}

export const authOptions: AuthOptions = {
  // Trust the host header to use the request origin instead of NEXTAUTH_URL
  trustHost: true,
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      name: "Sign in with Farcaster",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
        address: {
          label: "Wallet Address",
          type: "text",
          placeholder: "0x...",
        },
        // In a production app with a server, these should be fetched from
        // your Farcaster data indexer rather than have them accepted as part
        // of credentials.
        name: {
          label: "Name",
          type: "text",
          placeholder: "Your Name",
        },
        pfp: {
          label: "Profile Picture",
          type: "text",
          placeholder: "https://...",
        },
      },
      async authorize(credentials, req) {
        const csrfToken = req?.body?.csrfToken;
        if (!csrfToken) {
          console.error('CSRF token is missing from request');
          return null;
        }

        // Get the wallet address from the credentials
        const walletAddress = (credentials?.address as string)?.toLowerCase()?.trim();
        if (!walletAddress) {
          console.error('Wallet address is required');
          return null;
        }

        const appClient = createAppClient({
          ethereum: viemConnector(),
        });

        const domain = getDomainFromUrl(process.env.NEXTAUTH_URL);

        try {
          const verifyResponse = await appClient.verifySignInMessage({
            message: credentials?.message as string,
            signature: credentials?.signature as `0x${string}`,
            domain,
            nonce: csrfToken,
          });
          
          if (!verifyResponse.success) {
            console.error('Failed to verify sign in message');
            return null;
          }

          return {
            id: verifyResponse.fid.toString(),
            address: walletAddress,
            name: credentials?.name as string || '',
            image: credentials?.pfp as string || '',
          };
        } catch (error) {
          console.error('Error during sign in verification:', error);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',  // Use JWT strategy for better compatibility with server components
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      // Default to baseUrl
      return baseUrl;
    },
    async session({ session, token, user }) {
      console.log('Session callback - Token:', JSON.stringify(token, null, 2));
      
      if (session?.user) {
        // Set FID from token.sub (which comes from user.id)
        session.user.fid = parseInt(token.sub || '0');
        
        // Ensure wallet address is properly set from token or user
        if (token.address) {
          session.user.address = token.address as string;
        } else if (user?.address) {
          // Fallback to user object if token doesn't have address
          session.user.address = user.address as string;
        } else if (token.sub) {
          // If we have a token.sub but no address, use it as a fallback
          session.user.address = token.sub;
        }
        
        // Add other user properties from token or user with proper type handling
        if (token.name || user?.name) {
          session.user.name = (token.name as string) || user?.name || undefined;
        }
        if (token.email || user?.email) {
          session.user.email = (token.email as string) || user?.email || undefined;
        }
        if (token.image || user?.image) {
          session.user.image = (token.image as string) || user?.image || undefined;
        }
        
        console.log('Session user after update:', JSON.stringify(session.user, null, 2));
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      console.log('JWT callback - User:', JSON.stringify(user, null, 2));
      
      // Initial sign in
      if (user) {
        token.address = (user as any)?.address?.toLowerCase() || '';
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        
        console.log('JWT token after user sign in:', JSON.stringify(token, null, 2));
      }
      
      return token;
    },
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',  // Changed from 'none' to 'lax' for better security
        path: '/',
        secure: process.env.NODE_ENV === 'production',  // Only set secure in production
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "none",
        path: "/",
        secure: true
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true
      }
    }
  }
}

export const getSession = async () => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}
