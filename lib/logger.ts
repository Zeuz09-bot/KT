/**
 * Keraunous Tech Store — Structured Redacted Logger
 *
 * Rules:
 * - Structured JSON output.
 * - Phone numbers automatically masked (+23480****2409).
 * - Secrets, tokens, full addresses and passwords redacted.
 */

import crypto from 'crypto';
import { maskPhone } from './phone';

const SENSITIVE_KEYS = new Set([
  'token',
  'secret',
  'password',
  'turnstiletoken',
  'turnstile_token',
  'handofftoken',
  'handoff_token',
  'authorization',
  'cookie',
  'address',
  'delivery_address',
]);

export function hashIp(ip: string): string {
  if (!ip) return '';
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function redactValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;

  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lowerKey)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    // If key suggests a phone, or string matches Nigerian phone pattern
    if (lowerKey.includes('phone') || /^(?:\+?234|0)[789][01]\d{8}$/.test(value)) {
      return maskPhone(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(key, item));
  }

  if (typeof value === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitizedObj[k] = redactValue(k, v);
    }
    return sanitizedObj;
  }

  return value;
}

export interface LogContext {
  [key: string]: unknown;
}

function log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const payload: Record<string, unknown> = {
    timestamp,
    level,
    message,
  };

  if (context) {
    for (const [k, v] of Object.entries(context)) {
      payload[k] = redactValue(k, v);
    }
  }

  const jsonString = JSON.stringify(payload);
  if (level === 'error') {
    console.error(jsonString);
  } else if (level === 'warn') {
    console.warn(jsonString);
  } else {
    console.log(jsonString);
  }
}

export const logger = {
  info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
};
