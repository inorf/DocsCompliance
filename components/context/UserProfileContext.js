// context/UserProfileContext.js
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import UserProfile from '@/app/session/UserProfile';

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    groupName: '',
    isLoaded: false
  });

  // Use useCallback to prevent unnecessary re-renders
  const updateProfileFromStorage = useCallback(() => {
    const newProfile = {
      name: UserProfile.getName() || UserProfile.getEmail() || "team",
      email: UserProfile.getEmail() || '',
      groupName: UserProfile.getGName() || "your workspace",
      isLoaded: true
    };
    
    // Only update if something actually changed
    setProfile(prev => {
      if (prev.name === newProfile.name && 
          prev.email === newProfile.email && 
          prev.groupName === newProfile.groupName &&
          prev.isLoaded === newProfile.isLoaded) {
        return prev; // No change, return previous state
      }
      return newProfile;
    });
    
    return newProfile;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeProfile = async () => {
      try {
        // Sync with server once on mount
        await UserProfile.syncWithServer();
        if (isMounted) {
          updateProfileFromStorage();
        }
      } catch (error) {
        console.error('Failed to sync user profile:', error);
        if (isMounted) {
          updateProfileFromStorage(); // Fallback to whatever data we have
        }
      }
    };

    initializeProfile();

    return () => {
      isMounted = false;
    };
  }, [updateProfileFromStorage]);

  // Stable refreshProfile function
  const refreshProfile = useCallback(async () => {
    try {
      await UserProfile.syncWithServer();
      return updateProfileFromStorage();
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      throw error;
    }
  }, [updateProfileFromStorage]);

  const value = {
    name: profile.name,
    email: profile.email,
    groupName: profile.groupName,
    isLoaded: profile.isLoaded,
    refreshProfile
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProfileProvider');
  }
  return context;
}