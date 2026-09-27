export interface ScrapeAuditLog {
  timestamp: string;
  adminUsername: string;
  url: string;
  status: 'SUCCESS' | 'FAILED';
  durationMs: number;
  method?: 'HTTP' | 'HEADLESS_BROWSER';
  contentLength?: number;
  errorMessage?: string;
  modelUsed?: string;
}

export function logScrapeAttempt(log: ScrapeAuditLog) {
  const sanitizedUrl = log.url.split('?')[0]; // exclude query params from main log for privacy
  const statusEmoji = log.status === 'SUCCESS' ? '✅' : '❌';
  
  console.log(
    `[SCRAPE_AUDIT] ${statusEmoji} [${log.timestamp}] User: ${log.adminUsername} | Status: ${log.status} | Duration: ${log.durationMs}ms | Method: ${log.method || 'N/A'} | Model: ${log.modelUsed || 'N/A'} | URL: ${sanitizedUrl}` +
      (log.errorMessage ? ` | Error: ${log.errorMessage}` : '')
  );
}
