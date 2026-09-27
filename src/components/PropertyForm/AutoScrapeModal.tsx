'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, X, Globe, AlertCircle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface AutoScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (extractedData: any, warnings: string[]) => void;
}

export default function AutoScrapeModal({ isOpen, onClose, onSuccess }: AutoScrapeModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const validateUrl = (value: string): boolean => {
    if (!value || !value.trim()) {
      setValidationError('Please enter a property listing URL.');
      return false;
    }
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setValidationError('URL must begin with http:// or https://');
        return false;
      }
      setValidationError(null);
      return true;
    } catch {
      setValidationError('Invalid URL format. Example: https://www.magicbricks.com/...');
      return false;
    }
  };

  const handleClose = () => {
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setError(null);
    setValidationError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateUrl(url)) {
      return;
    }

    try {
      setLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/properties/auto-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to auto-scrape property details.');
      }

      // Successful extraction
      onSuccess(resData.data, resData.warnings || []);
      handleClose();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Scrape request cancelled by user.');
        return;
      }
      setError(err.message || 'An unexpected error occurred during scraping.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Auto-Scrape Listing</h2>
              <p className="text-xs text-slate-400">
                Paste any property listing URL to auto-extract and fill fields
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="scrape-url" className="mb-1.5 block text-xs font-semibold text-slate-300">
              Listing Webpage URL
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Globe className="h-4 w-4" />
              </div>
              <input
                id="scrape-url"
                type="text"
                disabled={loading}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (validationError) validateUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://housing.com/in/buy/projects/page/... or magicbricks.com/..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>
            {validationError && (
              <p className="mt-1 text-xs text-rose-400">{validationError}</p>
            )}
          </div>

          {/* Loading State Banner */}
          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-200 animate-pulse">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-400" />
              <div>
                <p className="font-semibold text-indigo-100">Fetching and analyzing property data…</p>
                <p className="text-[11px] text-indigo-300/80">
                  Extracting primary listing specs, pricing, amenities, and location via Gemini AI.
                </p>
              </div>
            </div>
          )}

          {/* Inline Error Alert with retry option */}
          {error && !loading && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-rose-200">{error}</p>
                <p className="text-[11px] text-rose-400/90">
                  Please verify the listing URL is public and accessible, then edit or retry.
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition disabled:opacity-50 active-press"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyzing Listing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Scrape & Fill Form</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
