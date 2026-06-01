'use client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './AuthProvider';
import AccountBar from './AccountBar';

// Client-side wrapper mounted in the root layout: provides auth/balance context,
// the account bar (login / balance / top-up), the auth modals and a global toaster.
export default function AuthShell({ children }) {
    return (
        <AuthProvider>
            {children}
            <AccountBar />
            <Toaster position="bottom-right" reverseOrder={false} />
        </AuthProvider>
    );
}
