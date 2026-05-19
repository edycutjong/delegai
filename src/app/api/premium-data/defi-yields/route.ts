import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment, getPaymentRequirements } from '@/lib/seller';
import { MOCK_DEFI_YIELDS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const paymentSig = request.headers.get('PAYMENT-SIGNATURE');

  const isValid = await verifyPayment(paymentSig);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Payment required' },
      { status: 402, headers: getPaymentRequirements() }
    );
  }

  return NextResponse.json(MOCK_DEFI_YIELDS);
}
