'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  IndianRupee,
  Phone,
  Mail,
  User,
  Calendar,
  Layers,
  ShieldCheck,
  Edit,
  ArrowLeft,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Car,
  Zap,
  Droplets,
  Wifi,
  Dog,
  Users,
} from 'lucide-react';

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/properties/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Property not found');
        return res.json();
      })
      .then((data) => {
        setProperty(data.property);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch property details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!property) return;
    try {
      setStatusUpdating(true);
      const newStatus = property.status === 'paused' ? 'active' : 'paused';
      const res = await fetch(`/api/properties/${property._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setProperty((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-400">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
        <h2 className="text-base font-bold text-white">Error Loading Property</h2>
        <p className="text-xs text-rose-300">{error || 'Property not found'}</p>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Properties</span>
        </Link>
      </div>
    );
  }

  const isPaused = property.status === 'paused';
  const coverImg =
    property.images?.find((i: any) => i.isCover)?.url ||
    property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-5 pb-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/properties"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-850 text-slate-300 hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                Status: {property.status?.toUpperCase() || 'PAUSED'}
              </span>
              <span className="text-[11px] text-slate-500">
                ID: {property._id}
              </span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-black text-white line-clamp-1">
              {property.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={statusUpdating}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              isPaused
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            {statusUpdating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : isPaused ? (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Activate</span>
              </>
            ) : (
              <>
                <PauseCircle className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            )}
          </button>

          <Link
            href={`/properties/${property._id}/edit`}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition active-press"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Property</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Media & Specs */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left Column (2 Cols): Images & Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Photo Gallery */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImg}
                alt={property.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-3 right-3 rounded-xl bg-slate-950/90 px-3 py-1.5 text-sm font-black text-indigo-300 backdrop-blur-md border border-indigo-500/30">
                ₹{property.rentAmount?.toLocaleString('en-IN')}/mo
              </div>
            </div>

            {/* Thumbnail Carousel if multiple images */}
            {property.images && property.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3 bg-slate-950/70 border-t border-slate-800">
                {property.images.map((img: any, idx: number) => {
                  const url = typeof img === 'string' ? img : img.url;
                  return (
                    <div
                      key={idx}
                      className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
                      {img.isCover && (
                        <div className="absolute top-1 left-1 rounded bg-indigo-600 px-1 text-[8px] font-bold text-white">
                          Cover
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key Specs Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Property Specifications
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500">Configuration</span>
                <p className="mt-1 font-bold text-white text-sm">{property.bhkConfig}</p>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500">Property Type</span>
                <p className="mt-1 font-bold text-white text-sm capitalize">{property.propertyType}</p>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500">Furnishing</span>
                <p className="mt-1 font-bold text-white text-sm capitalize">
                  {property.furnishingStatus?.replace('_', ' ')}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500">Tenant Preference</span>
                <p className="mt-1 font-bold text-white text-sm capitalize">
                  {property.tenantPreference}
                </p>
              </div>

              {property.areaSqft && (
                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                  <span className="text-slate-500">Built-up Area</span>
                  <p className="mt-1 font-bold text-white text-sm">{property.areaSqft} sq.ft</p>
                </div>
              )}

              {property.floor !== undefined && (
                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                  <span className="text-slate-500">Floor Level</span>
                  <p className="mt-1 font-bold text-white text-sm">
                    {property.floor} of {property.totalFloors || 'N/A'}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500">Management</span>
                <p className="mt-1 font-bold text-white text-sm capitalize">
                  {property.managementType?.replace('_', ' ')}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-500">Available From</span>
                <p className="mt-1 font-bold text-white text-sm">
                  {property.availableFrom
                    ? new Date(property.availableFrom).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Immediate'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Description
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities & Rules */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Amenities & Utilities
            </h2>

            {property.amenities && property.amenities.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-400">Amenities:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {property.amenities.map((item: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-2.5 py-1 text-xs text-indigo-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.safetyFeatures && property.safetyFeatures.length > 0 && (
              <div className="border-t border-slate-800 pt-3">
                <span className="text-xs font-semibold text-slate-400">Safety Features:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {property.safetyFeatures.map((item: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-xs text-emerald-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.houseRules && property.houseRules.length > 0 && (
              <div className="border-t border-slate-800 pt-3">
                <span className="text-xs font-semibold text-slate-400">House Rules:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {property.houseRules.map((item: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-purple-600/20 border border-purple-500/30 px-2.5 py-1 text-xs text-purple-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Owner, Pricing & Location */}
        <div className="space-y-5">
          {/* Owner Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Owner Information
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Verified
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-base">
                {property.ownerId?.name?.[0]?.toUpperCase() || 'O'}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  {property.ownerId?.name || 'Landlord / Owner'}
                </h3>
                <p className="text-xs text-indigo-300">{property.ownerId?.phone}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-indigo-500/20 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Direct Phone:</span>
                <a
                  href={`tel:${property.ownerId?.phone}`}
                  className="font-bold text-indigo-400 hover:underline"
                >
                  {property.ownerId?.phone || 'N/A'}
                </a>
              </div>

              {property.ownerId?.email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-300">{property.ownerId.email}</span>
                </div>
              )}

              {property.ownerId?.gender && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Gender / Age:</span>
                  <span className="text-slate-300 capitalize">
                    {property.ownerId.gender} {property.ownerId.age ? `(${property.ownerId.age}y)` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pricing Breakdown
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Monthly Rent</span>
                <span className="font-bold text-white text-sm">
                  ₹{property.rentAmount?.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Security Deposit</span>
                <span className="font-bold text-white text-sm">
                  ₹{property.depositAmount?.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Monthly Maintenance</span>
                <span className="font-semibold text-slate-300">
                  {property.maintenanceAmount ? `₹${property.maintenanceAmount.toLocaleString('en-IN')}` : 'Included'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Brokerage</span>
                <span className="font-semibold text-slate-300">
                  {property.brokerageFlag ? `₹${property.brokerageAmount?.toLocaleString('en-IN')}` : 'No Brokerage'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Min Lease Term</span>
                <span className="font-semibold text-slate-300">
                  {property.minLeaseMonths || 11} Months
                </span>
              </div>
            </div>
          </div>

          {/* Location & Coordinates */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Address & Geo-Location
            </h2>

            <div className="space-y-2 text-xs">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <p className="text-slate-300 font-medium leading-relaxed">
                  {property.addressLine}
                </p>
                <p className="mt-1 text-[11px] text-indigo-400 font-bold">
                  {property.localityId?.name}, {property.cityId?.name}
                </p>
              </div>

              <div className="flex items-center justify-between text-slate-400 pt-1">
                <span>Coordinates:</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {property.location?.coordinates?.[0]?.toFixed(4)}, {property.location?.coordinates?.[1]?.toFixed(4)}
                </span>
              </div>

              {property.googleMapPlaceId && (
                <div className="pt-1 text-[11px] text-slate-400">
                  <span className="text-slate-500">Landmark/Notes:</span> {property.googleMapPlaceId}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
