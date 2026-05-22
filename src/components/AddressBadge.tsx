'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { BLOCK_EXPLORER } from '@/lib/constants';

interface AddressBadgeProps {
  address: string;
  /** Number of leading hex chars to show (default: 10 → "0x1234abcd") */
  startChars?: number;
  /** Number of trailing chars to show (default: 4 → "...5678") */
  endChars?: number;
  /** Extra Tailwind classes */
  className?: string;
  /** If true, shows only the truncated text with no extra styling */
  minimal?: boolean;
}

/**
 * Truncated address badge with:
 * - Hover tooltip showing full address
 * - Click to copy to clipboard
 * - Link to block explorer
 */
export function AddressBadge({
  address,
  startChars = 10,
  endChars = 4,
  className = '',
  minimal = false,
}: AddressBadgeProps) {
  const [copied, setCopied] = useState(() => false);

  const truncated = `${address.slice(0, startChars)}…${address.slice(-endChars)}`;

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const ta = document.createElement('textarea');
      ta.value = address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [address]);

  if (minimal) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono ${className}`}
      >
        <a
          href={`${BLOCK_EXPLORER}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors duration-200 inline-flex items-center gap-0.5"
          title={`View on Etherscan: ${address}`}
        >
          <span>{truncated}</span>
          <ExternalLink size={9} className="opacity-40 hover:opacity-100 shrink-0" />
        </a>
        <button
          onClick={handleCopy}
          className="opacity-40 hover:opacity-100 transition-opacity duration-200 hover:text-primary"
          title="Copy address"
        >
          {copied ? (
            <Check size={10} className="text-success shrink-0" />
          ) : (
            <Copy size={10} className="shrink-0" />
          )}
        </button>
      </span>
    );
  }

  return (
    <span
      className={`group relative inline-flex items-center gap-1.5 font-mono text-xs text-text-muted ${className}`}
    >
      {/* Clickable address → opens explorer */}
      <a
        href={`${BLOCK_EXPLORER}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary transition-colors duration-200"
        title={`View on Etherscan: ${address}`}
      >
        {truncated}
      </a>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-primary"
        title="Copy address"
      >
        {copied ? (
          <Check size={12} className="text-success" />
        ) : (
          <Copy size={12} />
        )}
      </button>


    </span>
  );
}
