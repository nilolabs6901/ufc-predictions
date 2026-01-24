import { NextResponse } from 'next/server';

export async function GET() {
  const ufcKey = process.env.UFC_ANTHROPIC_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const effectiveKey = ufcKey || anthropicKey;

  return NextResponse.json({
    hasUfcKey: !!ufcKey,
    ufcKeyLength: ufcKey?.length || 0,
    ufcKeyPrefix: ufcKey?.substring(0, 15) || 'not set',
    hasAnthropicKey: !!anthropicKey,
    anthropicKeyValue: anthropicKey === '' ? 'EMPTY' : anthropicKey === undefined ? 'UNDEFINED' : 'SET',
    effectiveKeySet: !!effectiveKey,
    nodeEnv: process.env.NODE_ENV,
  });
}
