'use client';

import { useState } from 'react';
import { AddPatientMethodSelector } from './components/add-patient-method-selector';
import { ManualPatientRegistration } from './components/manual-patient-registration';

export function AddPatientMethodContent() {
  const [mode, setMode] = useState<'method' | 'manual'>('method');

  if (mode === 'manual') {
    return <ManualPatientRegistration onBack={() => setMode('method')} />;
  }

  return <AddPatientMethodSelector onSelectManual={() => setMode('manual')} />;
}
