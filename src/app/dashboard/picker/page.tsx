import { redirect } from 'next/navigation';

// Studies are now created from a subject's page (dashboard → kid → subject → topic)
export default function PickerPage() { redirect('/dashboard'); }
