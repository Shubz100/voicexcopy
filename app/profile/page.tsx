'use client'

import React, { useState, useEffect } from 'react';
import './profile.css';

interface ProfileData {
  finalpis: number[];
  totalPiSold: number;
  xp: number;
  level: number;
  piPoints: number;
  transactionStatus: string[];
  piAmount: number[];
}

interface XPRequirement {
  current: number;
  required: number;
}

interface Level {
  name: string;
  threshold: number;
  pointsPerHundredXP: number;
}

const Profile = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    finalpis: [],
    totalPiSold: 0,
    xp: 0,
    level: 1,
    piPoints: 0,
    transactionStatus: ['processing'],
    piAmount: []
  });

  const levels: Level[] = [
    { name: 'Rookie', threshold: 100, pointsPerHundredXP: 1 },
    { name: 'Bronze', threshold: 101, pointsPerHundredXP: 3 },
    { name: 'Silver', threshold: 300, pointsPerHundredXP: 5 },
    { name: 'Gold', threshold: 700, pointsPerHundredXP: 7 },
    { name: 'Diamond', threshold: 1100, pointsPerHundredXP: 10 },
    { name: 'Platinum', threshold: 1500, pointsPerHundredXP: 15 },
    { name: 'Infinite', threshold: Infinity, pointsPerHundredXP: 15 }
  ];

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      const webAppUser = tg.initDataUnsafe?.user;
      if (webAppUser) {
        fetchProfileData(webAppUser.id);
      }
    }
  }, []);

  const calculateTotalPiSold = (statuses: string[], amounts: number[]): number => {
    return statuses.reduce((total, status, index) => {
      if (status === 'completed') {
        return total + (amounts[index] || 0);
      }
      return total;
    }, 0);
  };

  const updateUserLevel = async (telegramId: number, level: number) => {
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: telegramId,
          level: level,
          updateLevel: true
        })
      });
    } catch (error) {
      console.error('Error updating user level:', error);
    }
  };

  const fetchProfileData = async (telegramId: number) => {
    try {
      const response = await fetch(`/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: telegramId })
      });
      const userData = await response.json();
      
      // Calculate total Pi sold based on completed transactions only
      const totalPiSold = calculateTotalPiSold(userData.transactionStatus, userData.piAmount);
      const xp = totalPiSold;
      const currentLevel = getCurrentLevel(xp);
      const piPoints = calculatePiPoints(xp, currentLevel);

      // Update the level in database if it's different
      if (userData.level !== currentLevel) {
        updateUserLevel(telegramId, currentLevel);
      }

      setProfileData({
        finalpis: userData.finalpis,
        totalPiSold,
        xp,
        level: currentLevel,
        piPoints,
        transactionStatus: userData.transactionStatus,
        piAmount: userData.piAmount
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const calculatePiPoints = (xp: number, level: number): number => {
    const pointsRate = levels[level - 1]?.pointsPerHundredXP || levels[levels.length - 1].pointsPerHundredXP;
    return Math.floor(xp / 100) * pointsRate;
  };

  const getCurrentLevel = (totalXp: number): number => {
    let remainingXp = totalXp;
    for (let i = 0; i < levels.length; i++) {
      if (remainingXp < levels[i].threshold) {
        return i + 1;
      }
      remainingXp -= levels[i].threshold;
    }
    return levels.length + 1; // For infinite level
  };

  const getProgress = (totalXp: number): number => {
    let remainingXp = totalXp;
    const currentLevel = getCurrentLevel(totalXp);
    
    // If at infinite level
    if (currentLevel > levels.length) {
      return (remainingXp / 1000000) * 100;
    }

    // Calculate XP for current level
    for (let i = 0; i < currentLevel - 1; i++) {
      remainingXp -= levels[i].threshold;
    }

    const currentThreshold = currentLevel <= levels.length 
      ? levels[currentLevel - 1].threshold 
      : 1000000;

    return (remainingXp / currentThreshold) * 100;
  };

  const getLevelName = (level: number): string => {
    if (level > levels.length) {
      return 'Infinite';
    }
    return levels[level - 1]?.name || 'Max Level';
  };

  const getRequiredXP = (totalXp: number): XPRequirement => {
    let remainingXp = totalXp;
    const currentLevel = getCurrentLevel(totalXp);
    
    // If at infinite level
    if (currentLevel > levels.length) {
      return {
        current: remainingXp,
        required: 1000000
      };
    }

    // Calculate remaining XP for current level
    for (let i = 0; i < currentLevel - 1; i++) {
      remainingXp -= levels[i].threshold;
    }

    return {
      current: remainingXp,
      required: levels[currentLevel - 1].threshold
    };
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <h2>Total Pi Sold</h2>
          <div className="stat-value">
            <span className="number">{profileData.totalPiSold}</span>
            <span className="unit">Pi</span>
          </div>
        </div>

        <div className="profile-card">
          <h2>Level Progress</h2>
          <div className="level-info">
            <span className="level-name">
              Level {getCurrentLevel(profileData.xp)} - {getLevelName(getCurrentLevel(profileData.xp))}
            </span>
            <div className="xp-display">
              {getRequiredXP(profileData.xp).current}/{getRequiredXP(profileData.xp).required} XP
            </div>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${getProgress(profileData.xp)}%` }}
            ></div>
          </div>
        </div>

        <div className="profile-card">
          <h2>Pi Points</h2>
          <div className="stat-value">
            <span className="number">{profileData.piPoints}</span>
            <span className="unit">Points</span>
          </div>
          <div className="points-info">
            Current Rate: {levels[getCurrentLevel(profileData.xp) - 1]?.pointsPerHundredXP || 15} 
            points per 100 XP
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
