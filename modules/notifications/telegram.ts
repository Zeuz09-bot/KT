import 'server-only';

import { logger } from '@/lib/logger';
import type { NotificationResult } from './types';

/**
 * Sends a message via the Telegram Bot HTTP API.
 * Never throws — returns NotificationResult.
 */
export async function sendTelegramMessage(htmlText: string): Promise<NotificationResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // In test / dev environments when Telegram credentials are not configured
  if (!botToken || !chatId) {
    logger.info('[NOTIFICATION LOG DISPATCH]', {
      channel: 'log',
      messagePreview: htmlText.replace(/<[^>]+>/g, '').slice(0, 150),
    });
    return {
      success: true,
      channel: 'log',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Telegram notification HTTP failure', {
        status: response.status,
        error: errorText,
      });
      return {
        success: false,
        channel: 'telegram',
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = (await response.json()) as {
      ok?: boolean;
      result?: { message_id?: number };
      description?: string;
    };

    if (!data.ok) {
      logger.error('Telegram API returned error', { description: data.description });
      return {
        success: false,
        channel: 'telegram',
        error: data.description,
      };
    }

    return {
      success: true,
      channel: 'telegram',
      messageId: data.result?.message_id,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Failed to send Telegram notification (network error)', {
      error: errorMsg,
    });
    return {
      success: false,
      channel: 'telegram',
      error: errorMsg,
    };
  }
}
