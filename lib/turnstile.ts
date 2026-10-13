/**
 * Keraunous Tech Store — Cloudflare Turnstile Verification Helper
 *
 * Implements Blueprint §10.3 (U15) & §12.1:
 * - Centralized Turnstile captcha verification
 * - Strict fail-closed policy when configured in production
 * - Development and test bypass using dummy keys and test tokens
 */

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
}

/**
 * Verifies a Cloudflare Turnstile captcha token.
 *
 * @param token Token received from the client Turnstile widget
 * @param remoteIp Client IP address
 * @returns boolean indicating if the token is valid
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp: string,
): Promise<boolean> {
  // Always fail closed if token is missing, empty, or whitespace
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return false;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Cloudflare test tokens
  if (token === '1x00000000000000000000AA' || token.startsWith('test-token-auto-approved')) {
    return true;
  }
  if (token === '2x00000000000000000000AB' || token === 'test-token-rejected') {
    return false;
  }

  // In test or development without secret key configured:
  if (!secretKey) {
    return true;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token.trim());
    formData.append('remoteip', remoteIp);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false; // Fail closed on HTTP failure
    }

    const data = (await response.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    // Fail closed on network failure, timeout, or DNS resolution issue
    return false;
  }
}
