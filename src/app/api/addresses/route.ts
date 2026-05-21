import { NextResponse } from 'next/server';
import { createSmartAccount } from '@/lib/delegator';
import { RPC_URL, USDC_ADDRESS, USDC_DECIMALS } from '@/lib/constants';

async function getUsdcBalance(address: string): Promise<number> {
  const { createPublicClient, http } = await import('viem');
  const { sepolia } = await import('viem/chains');

  const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
  const raw = await client.readContract({
    address: USDC_ADDRESS,
    abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }],
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  }) as bigint;

  return Number(raw) / 10 ** USDC_DECIMALS;
}

export async function GET() {
  try {
    const [user, master, dataWorker, execWorker] = await Promise.all([
      createSmartAccount('user'),
      createSmartAccount('master'),
      createSmartAccount('data-worker'),
      createSmartAccount('exec-worker'),
    ]);

    const usdcBalance = await getUsdcBalance(user);

    return NextResponse.json({
      user,
      master,
      'data-worker': dataWorker,
      'exec-worker': execWorker,
      usdcBalance,
    });
  } catch (_err) {
    return NextResponse.json({ error: 'Keys not configured' }, { status: 500 });
  }
}
