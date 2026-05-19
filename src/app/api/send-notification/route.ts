// Farcaster notifications removed
export async function POST() {
  return Response.json({ success: false, error: 'Notifications not supported' }, { status: 410 });
}
