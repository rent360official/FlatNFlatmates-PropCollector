'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Calendar,
  Phone,
  Building2,
  MapPin,
  ExternalLink,
  Edit,
  PlusCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export default function PropertiesListPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  // Filters
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'custom'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProperties = useCallback(async (pageToFetch = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.set('page', pageToFetch.toString());
      params.set('limit', '12');

      if (phoneQuery.trim()) params.set('phone', phoneQuery.trim());
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      // Handle Date filters
      if (datePreset === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        params.set('fromDate', todayStr);
        params.set('toDate', todayStr);
      } else if (datePreset === 'week') {
        const pastWeek = new Date();
        pastWeek.setDate(pastWeek.getDate() - 7);
        params.set('fromDate', pastWeek.toISOString().split('T')[0]);
        params.set('toDate', new Date().toISOString().split('T')[0]);
      } else if (datePreset === 'custom') {
        if (fromDate) params.set('fromDate', fromDate);
        if (toDate) params.set('toDate', toDate);
      }

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load properties');
      const data = await res.json();

      setProperties(data.properties || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [phoneQuery, searchQuery, statusFilter, datePreset, fromDate, toDate]);

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  // Quick toggle status between paused and active
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      setUpdatingId(id);
      const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Update in state
      setProperties((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Could not update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const clearAllFilters = () => {
    setPhoneQuery('');
    setSearchQuery('');
    setStatusFilter('all');
    setDatePreset('all');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters =
    phoneQuery.trim() !== '' ||
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    datePreset !== 'all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">Registered Properties</h1>
          <p className="text-xs text-slate-400">
            View, search by phone number or date, inspect and edit field submissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/properties/new"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active-press"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Property</span>
          </Link>
          <button
            onClick={() => fetchProperties(pagination.page)}
            disabled={loading}
            title="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-md backdrop-blur-sm space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Phone Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-400">
              <Phone className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              placeholder="Search by Owner Phone..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Title Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Title / Address..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Date Filter Preset Buttons & Filter toggle */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                showFilters || hasActiveFilters
                  ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                  : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Date & Status Filters</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/30" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                title="Clear Filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="border-t border-slate-800/80 pt-3 space-y-3 animate-in fade-in duration-150">
            {/* Date Preset Filter */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Filter by Date Added
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Past 7 Days' },
                  { id: 'custom', label: 'Custom Range' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDatePreset(d.id as any)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      datePreset === d.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {datePreset === 'custom' && (
                <div className="mt-2.5 grid grid-cols-2 gap-2 max-w-md">
                  <div>
                    <span className="text-[10px] text-slate-400">From Date</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">To Date</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Property Status
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Statuses' },
                  { id: 'paused', label: 'Paused (Collector Default)' },
                  { id: 'active', label: 'Active' },
                  { id: 'draft', label: 'Draft' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      statusFilter === s.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>
          Showing <strong>{properties.length}</strong> of <strong>{pagination.total}</strong> properties
        </span>
        {hasActiveFilters && (
          <span className="text-indigo-400 font-medium">Filtered results</span>
        )}
      </div>

      {/* Properties Card Grid */}
      {loading ? (
        <div className="flex h-56 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <RefreshCw className="h-7 w-7 animate-spin text-indigo-400" />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-2 text-base font-bold text-white">No properties found</h3>
          <p className="mt-1 text-xs text-slate-400">
            {hasActiveFilters
              ? 'No properties match the applied phone or date filters.'
              : 'Start by registering your first field property.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Register Property</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop: any) => {
            const coverImg =
              prop.images?.find((i: any) => i.isCover)?.url ||
              prop.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80';

            const isPaused = prop.status === 'paused';
            const isUpdating = updatingId === prop._id;

            return (
              <div
                key={prop._id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover:border-indigo-500/40 transition-all hover:shadow-xl"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImg}
                      alt={prop.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-md backdrop-blur-md uppercase tracking-wider ${
                          isPaused
                            ? 'bg-amber-500/90 text-white'
                            : prop.status === 'active'
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-slate-700/90 text-slate-200'
                        }`}
                      >
                        {prop.status || 'PAUSED'}
                      </span>
                    </div>

                    {/* BHK & Rent */}
                    <div className="absolute top-2 right-2 rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-slate-700/50">
                      {prop.bhkConfig}
                    </div>

                    <div className="absolute bottom-2 right-2 rounded-lg bg-slate-950/90 px-2.5 py-1 text-xs font-bold text-indigo-300 backdrop-blur-md border border-indigo-500/30">
                      ₹{prop.rentAmount?.toLocaleString('en-IN')}/mo
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="line-clamp-1 text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {prop.title}
                  </h2>

                  {/* Location */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="line-clamp-1">
                      {prop.localityId?.name || 'Locality'}, {prop.cityId?.name || 'City'}
                    </span>
                  </div>

                  {/* Owner Info & Date */}
                  <div className="mt-3 rounded-xl bg-slate-950/70 p-2.5 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Owner Phone:</span>
                      <div className="flex items-center gap-1 font-bold text-slate-200">
                        <Phone className="h-3 w-3 text-indigo-400" />
                        <span>{prop.ownerId?.phone || 'No phone'}</span>
                      </div>
                    </div>
                    {prop.ownerId?.name && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Owner Name:</span>
                        <span className="text-slate-300 font-medium">{prop.ownerId.name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-slate-800 pt-1 text-[11px] text-slate-500">
                      <span>Collected Date:</span>
                      <span>
                        {new Date(prop.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-3 space-y-2 border-t border-slate-800/60 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/properties/${prop._id}`}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View</span>
                    </Link>

                    <Link
                      href={`/properties/${prop._id}/edit`}
                      className="flex items-center justify-center gap-1 rounded-xl bg-indigo-600/20 border border-indigo-500/30 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/40 hover:text-white transition"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Link>
                  </div>

                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(prop._id, prop.status)}
                    disabled={isUpdating}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-semibold border transition ${
                      isPaused
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                    }`}
                  >
                    {isUpdating ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : isPaused ? (
                      <>
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>Activate Property</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="h-3.5 w-3.5" />
                        <span>Pause Property</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => fetchProperties(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>
          <span className="text-xs text-slate-400">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
          </span>
          <button
            onClick={() => fetchProperties(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
