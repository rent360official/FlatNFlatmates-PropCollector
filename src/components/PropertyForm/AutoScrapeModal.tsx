'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Globe,
  FileText,
  AlertCircle,
  Loader2,
  ClipboardPaste,
  Trash2,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AutoScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (extractedData: any, warnings: string[]) => void;
}

export default function AutoScrapeModal({ isOpen, onClose, onSuccess }: AutoScrapeModalProps) {
  const [activeMode, setActiveMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
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

  const validateRawText = (value: string): boolean => {
    if (!value || value.trim().length < 10) {
      setValidationError('Please paste at least a few lines of property details (min 10 characters).');
      return false;
    }
    setValidationError(null);
    return true;
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

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawText((prev) => (prev ? `${prev}\n${text}` : text));
          setValidationError(null);
          setError(null);
        }
      }
    } catch {
      // Clipboard read permission might be blocked in some browsers
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let payload: { url?: string; rawText?: string } = {};

    if (activeMode === 'url') {
      if (!validateUrl(url)) return;
      payload = { url: url.trim() };
      if (rawText.trim()) {
        payload.rawText = rawText.trim();
      }
    } else {
      if (!validateRawText(rawText)) return;
      payload = { rawText: rawText.trim() };
      if (url.trim()) {
        payload.url = url.trim();
      }
    }

    try {
      setLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/properties/auto-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to auto-extract property details.');
      }

      // Successful extraction
      onSuccess(resData.data, resData.warnings || []);
      handleClose();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Extraction request cancelled by user.');
        return;
      }
      setError(err.message || 'An unexpected error occurred during extraction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Auto-Extract Property Details</h2>
              <p className="text-xs text-slate-400">
                Auto-populate Basic Specs, Pricing & Lease, and Amenities & Rules
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

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveMode('url');
              setValidationError(null);
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              activeMode === 'url'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Listing Webpage URL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('text');
              setValidationError(null);
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              activeMode === 'text'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Paste Listing Text</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode 1: URL Input */}
          {activeMode === 'url' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="scrape-url" className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Property Listing URL
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
                    placeholder="https://housing.com/in/buy/projects/... or magicbricks.com/..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Optional supplementary text */}
              <div>
                <label htmlFor="supplementary-text" className="mb-1 block text-[11px] font-medium text-slate-400">
                  Additional Notes / Text <span className="text-slate-500">(Optional - will be merged with URL scrape)</span>
                </label>
                <textarea
                  id="supplementary-text"
                  rows={2}
                  disabled={loading}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste any extra description, owner remarks, or unlisted house rules..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>
            </div>
          )}

          {/* Mode 2: Raw Textarea Paste */}
          {activeMode === 'text' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="raw-listing-text" className="block text-xs font-semibold text-slate-300">
                  Paste Property Listing Content / Description
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-indigo-300 hover:bg-slate-700 transition"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="h-3 w-3" />
                    <span>Paste Clipboard</span>
                  </button>
                  {rawText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-rose-300 hover:bg-slate-700 transition"
                      title="Clear text"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="raw-listing-text"
                  rows={8}
                  disabled={loading}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    if (validationError) validateRawText(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={`Paste full property text copied from MagicBricks, Housing, 99acres, NoBroker, OLX, or WhatsApp:\n\nExample:\n2 BHK Flat in Kharadi, Pune. Rent: 32000, Deposit: 75000, Maintenance: 2000.\nArea: 1050 sqft, 4th floor out of 12. Semi Furnished with AC, Geyser, Modular Kitchen, Wardrobes.\nCovered car parking, 100% power backup, gated security, gym, swimming pool.\nAvailable from next month. 11 months lease, 1 month lock-in.`}
                  className="w-full font-mono rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-60 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-indigo-400" />
                  AI will extract specs, rent, deposit, amenities, utilities & rules.
                </span>
                <span>{rawText.length} characters</span>
              </div>
            </div>
          )}

          {validationError && (
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{validationError}</span>
            </p>
          )}

          {/* Loading State Banner */}
          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-200 animate-pulse">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-400" />
              <div>
                <p className="font-semibold text-indigo-100">
                  Analyzing listing specifications, pricing, amenities & rules…
                </p>
                <p className="text-[11px] text-indigo-300/80">
                  Formatting and populating Basic Specs, Pricing & Lease, and Amenities via Gemini AI.
                </p>
              </div>
            </div>
          )}

          {/* Inline Error Alert */}
          {error && !loading && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-rose-200">{error}</p>
                <p className="text-[11px] text-rose-400/90">
                  Please review the input text or URL and try again.
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
              disabled={loading || (activeMode === 'url' ? !url.trim() : !rawText.trim())}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition disabled:opacity-50 active-press"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{activeMode === 'url' ? 'Scrape & Populate Form' : 'Extract & Populate Form'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
