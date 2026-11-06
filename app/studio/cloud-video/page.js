import { redirect } from 'next/navigation';

export const metadata = { title: 'Cloud Video Studio — Image to Video' };

export default function CloudVideoPage() {
  redirect('/personal/video');
}
