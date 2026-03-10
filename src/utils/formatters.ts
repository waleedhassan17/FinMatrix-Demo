// ============================================================
// FINMATRIX - Formatting Utilities
// ============================================================

/**
 * Format a number as US currency: "$1,234.56"
 */
export function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Format an ISO date string as "Mar 3, 2026"
 */
export function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string as "Mar 3, 2026 2:30 PM"
 */
export function formatDateTime(d: string): string {
  const date = new Date(d);
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  );
}

/**
 * Format an ISO date string as relative time:
 * "just now" / "5 min ago" / "2 hours ago" / "Yesterday" / "Mar 1"
 */
export function formatRelativeTime(d: string): string {
  const now = new Date();
  const date = new Date(d);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncateText(t: string, max: number): string {
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + '…';
}

/**
 * Format a phone string as "(123) 456-7890"
 */
export function formatPhoneNumber(p: string): string {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return p; // Return as-is if not standard US format
}
