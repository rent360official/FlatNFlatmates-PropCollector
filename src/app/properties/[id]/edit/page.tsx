'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PropertyForm from '@/components/PropertyForm/PropertyForm';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-400">Loading property data...</p>
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

  return (
    <div className="py-2">
      <PropertyForm initialData={property} isEditMode={true} />
    </div>
  );
}
