"use client";

import { useState, useEffect } from 'react';
import { CreativeCanvas } from 'design-agent';

import { getUserBalance } from '../muapi';

export default function DesignAgentStudio({
  apiKey,
  userEmail,
  balance,
  isHeaderVisible,
  onToggleHeader,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
}) {
  const [userData, setUserData] = useState(null);

  // CreativeCanvas currently reads this compatibility key during its first render.
  // Remove it immediately whenever the design agent is not active or the user signs out.
  if (typeof window !== 'undefined' && apiKey) {
    sessionStorage.setItem("fromDesignAgent", "true");
    localStorage.setItem("token", apiKey);
  }

  useEffect(() => {
    if (!apiKey) localStorage.removeItem('token');
    return () => localStorage.removeItem('token');
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) return;

    // White-label shells already know the end user's identity/credit balance (fetched via
    // /api/whitelabel/balance) and pass them in directly — GET /account/balance explicitly
    // 403s for white-label end users, so getUserBalance() below must stay BYOK-only.
    if (userEmail !== undefined || balance !== undefined) {
      setUserData({
        username: userEmail?.split('@')[0] || 'Studio User',
        email: userEmail,
        balance: balance || 0,
      });
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await getUserBalance(apiKey);
        setUserData({
          username: data.email?.split('@')[0] || 'Studio User',
          email: data.email,
          balance: data.balance || 0
        });
      } catch (err) {
        console.error('Failed to fetch user data for Design Agent:', err);
      }
    };

    fetchUser();
  }, [apiKey, userEmail, balance]);

  return (
    <div className="h-full w-full bg-black overflow-hidden design-agent-studio">
      <CreativeCanvas 
        user={userData}
        isAuthorized={!!userData}
        creditConversionRate={200}
        theme="dark"
        onToggleHeader={onToggleHeader}
        isHeaderVisible={isHeaderVisible}
        onGenerationStart={onGenerationStart}
        onGenerationEnd={onGenerationEnd}
        onGenerationComplete={onGenerationComplete}
        onGenerationError={onGenerationError}
      />
    </div>
  );
}
