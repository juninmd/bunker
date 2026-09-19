// RFC 6238 TOTP over WebCrypto HMAC; accepts a bare base32 secret or an otpauth:// URI.
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ALGORITHMS: Record<string, 'SHA-1' | 'SHA-256' | 'SHA-512'> = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' };

export interface TotpConfig {
  secret: Uint8Array;
  digits: number;
  period: number;
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512';
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error('INVALID_TOTP_SECRET');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

export function parseTotp(raw: string): TotpConfig {
  const value = raw.trim();
  let secret = value;
  let digits = 6;
  let period = 30;
  let algorithm: TotpConfig['algorithm'] = 'SHA-1';
  if (/^otpauth:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.host.toLowerCase() !== 'totp') throw new Error('INVALID_TOTP_SECRET');
    secret = url.searchParams.get('secret') ?? '';
    digits = Number(url.searchParams.get('digits') ?? 6);
    period = Number(url.searchParams.get('period') ?? 30);
    const alg = ALGORITHMS[(url.searchParams.get('algorithm') ?? 'SHA1').toUpperCase()];
    if (!alg) throw new Error('INVALID_TOTP_SECRET');
    algorithm = alg;
  }
  const bytes = base32Decode(secret);
  if (bytes.length < 10 || ![6, 7, 8].includes(digits) || !Number.isInteger(period) || period < 1 || period > 300) {
    throw new Error('INVALID_TOTP_SECRET');
  }
  return { secret: bytes, digits, period, algorithm };
}

export async function generateTotp(config: TotpConfig, nowMs = Date.now()): Promise<{ code: string; remaining: number }> {
  const counter = Math.floor(nowMs / 1000 / config.period);
  const message = new DataView(new ArrayBuffer(8));
  message.setUint32(0, Math.floor(counter / 2 ** 32));
  message.setUint32(4, counter >>> 0);
  const key = await crypto.subtle.importKey('raw', config.secret as BufferSource, { name: 'HMAC', hash: config.algorithm }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, message.buffer));
  const offset = (mac[mac.length - 1] as number) & 0x0f;
  const binary = (((mac[offset] as number) & 0x7f) << 24) | ((mac[offset + 1] as number) << 16) | ((mac[offset + 2] as number) << 8) | (mac[offset + 3] as number);
  const code = String(binary % 10 ** config.digits).padStart(config.digits, '0');
  const remaining = config.period - (Math.floor(nowMs / 1000) % config.period);
  return { code, remaining };
}

export function isValidTotp(raw: string): boolean {
  try {
    parseTotp(raw);
    return true;
  } catch {
    return false;
  }
}
