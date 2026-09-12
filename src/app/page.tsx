'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  ListOrdered,
  Search,
  Clock,
  CheckCircle,
  PauseCircle,
  TrendingUp,
  MapPin,
  Phone,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const data = await res.json();
      setStats(data.stats);
      setRecentProperties(data.recentProperties || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/60 p-5 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Property Collector Admin
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Field Collection Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Collect owner details, property specs, and save directly into the database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/properties/new"
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active-press"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Register New Property</span>
            </Link>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              title="Refresh Data"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {/* Total Collected */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Properties</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {loading ? '-' : stats?.totalProperties ?? 0}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">In database</p>
        </div>

        {/* Active Properties */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300">Active</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-300">
            {loading ? '-' : stats?.activeProperties ?? 0}
          </div>
          <p className="mt-0.5 text-[11px] text-emerald-400/70">Live on platform</p>
        </div>

        {/* Paused Properties */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Paused</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <PauseCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {loading ? '-' : stats?.pausedProperties ?? 0}
          </div>
          <p className="mt-0.5 text-[11px] text-amber-400/70">Paused listings</p>
        </div>

        {/* Pending Owner Approval */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-violet-300">Pending Approval</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-violet-300">
            {loading ? '-' : stats?.pendingApprovalProperties ?? 0}
          </div>
          <p className="mt-0.5 text-[11px] text-violet-400/70">Awaiting owner</p>
        </div>

        {/* Added This Week */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 backdrop-blur-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-300">Added This Week</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300">
            {loading ? '-' : stats?.weekCount ?? 0}
          </div>
          <p className="mt-0.5 text-[11px] text-purple-400/70">Last 7 days</p>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Admin Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Card 1: Register New Property */}
          <Link
            href="/properties/new"
            className="group flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900/40 to-slate-900/80 p-4 transition hover:border-indigo-500/60 hover:bg-indigo-900/60 active-press"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <PlusCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Register New Property
                </h3>
                <p className="text-xs text-slate-400">
                  Multi-tab registration with Owner selection or creation
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-indigo-400 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Card 2: View & Filter Properties */}
          <Link
            href="/properties"
            className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700 hover:bg-slate-800/80 active-press"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 border border-slate-700 group-hover:scale-105 transition-transform">
                <ListOrdered className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Browse & Filter Properties
                </h3>
                <p className="text-xs text-slate-400">
                  Filter by Phone, Date range, and edit details
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent Field Registrations</h2>
            <p className="text-xs text-slate-400">Latest properties added to the platform</p>
          </div>
          <Link
            href="/properties"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : recentProperties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-2 text-sm font-semibold text-white">No properties registered yet</h3>
            <p className="mt-1 text-xs text-slate-400">
              Click the button below to register your first property.
            </p>
            <Link
              href="/properties/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Register Property</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentProperties.map((prop: any) => {
              const coverImg =
                prop.images?.find((i: any) => i.isCover)?.url ||
                prop.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80';

              return (
                <div
                  key={prop._id}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 hover:border-indigo-500/40 transition-all hover:shadow-lg"
                >
                  <div>
                    {/* Image & Status Tag */}
                    <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImg}
                        alt={prop.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm backdrop-blur-md ${
                            prop.status === 'pending_owner_approval'
                              ? 'bg-violet-600/90 text-white'
                              : prop.status === 'paused'
                              ? 'bg-amber-500/80 text-white'
                              : prop.status === 'active'
                              ? 'bg-emerald-500/80 text-white'
                              : 'bg-slate-700/80 text-slate-200'
                          }`}
                        >
                          {prop.status === 'pending_owner_approval'
                            ? 'PENDING APPROVAL'
                            : prop.status
                            ? prop.status.toUpperCase()
                            : 'PAUSED'}
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 rounded-lg bg-slate-950/80 px-2 py-0.5 text-xs font-bold text-indigo-300 backdrop-blur-md">
                        ₹{prop.rentAmount?.toLocaleString('en-IN')}/mo
                      </div>
                    </div>

                    {/* Title & BHK */}
                    <h3 className="line-clamp-1 text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {prop.title}
                    </h3>

                    {/* Location */}
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="line-clamp-1">
                        {prop.localityId?.name || 'Locality'}, {prop.cityId?.name || 'City'}
                      </span>
                    </div>

                    {/* Owner details */}
                    <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 font-medium text-slate-300">
                        <Phone className="h-3 w-3 text-indigo-400" />
                        <span>{prop.ownerId?.phone || 'No phone'}</span>
                      </div>
                      <span className="text-slate-500">
                        {new Date(prop.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-2.5">
                    <Link
                      href={`/properties/${prop._id}`}
                      className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </Link>
                    <Link
                      href={`/properties/${prop._id}/edit`}
                      className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/40 hover:text-white transition"
                    >
                      <span>Edit</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
