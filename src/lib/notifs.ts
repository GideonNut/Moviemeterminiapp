// Farcaster notifications removed — MiniPay uses wallet-native UX
export async function sendFrameNotification(_: {
  fid: number;
  title: string;
  body: string;
}): Promise<{ state: 'no_token' }> {
  return { state: 'no_token' };
}
