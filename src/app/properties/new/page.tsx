'use client';

import React from 'react';
import PropertyForm from '@/components/PropertyForm/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="py-2">
      <PropertyForm isEditMode={false} />
    </div>
  );
}
