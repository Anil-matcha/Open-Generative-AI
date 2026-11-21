import StudioContextProvider from '@/components/personal/StudioContext';
import './personal.css';
export const metadata = { title: 'Kişisel AI Stüdyo', description: 'Bulutta kişisel video, karakter ve sahne stüdyosu.' };
export default function PersonalLayout({ children }) { return <StudioContextProvider>{children}</StudioContextProvider>; }
