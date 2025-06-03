import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return new Response('Missing username parameter', { status: 400 });
    }

    // Fetch user data from your API
    const user = {
      display_name: username,
      username: username,
      pfp_url: 'https://i.postimg.cc/Gtz6FMmk/new-favicon.png'
    };

  return new ImageResponse(
    (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#6B46C1',
          padding: '40px',
        }}>
        {user?.pfp_url && (
            <div style={{
              width: '384px',
              height: '384px',
              borderRadius: '50%',
              overflow: 'hidden',
              marginBottom: '32px',
              border: '32px solid white',
            }}>
              <img
                src={user.pfp_url}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
          </div>
        )}
          <h1 style={{
            fontSize: '96px',
            color: 'white',
            textAlign: 'center',
          }}>
            {user?.display_name ? `Hello from ${user.display_name ?? user.username}!` : 'Hello!'}
          </h1>
      </div>
    ),
    {
      width: 1200,
        height: 630,
    }
  );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate image', { status: 500 });
  }
}