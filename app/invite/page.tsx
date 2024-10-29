'use client'

import React, { useState, useEffect, useRef } from 'react';
import { prisma } from '@/lib/prisma';

const InvitePage = () => {
  const [user, setUser] = useState<any>(null);
  const [inviterInfo, setInviterInfo] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<{ username: string; totalPoints: number; invitePoints: number }[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await fetch('/api/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: Telegram?.WebApp?.initDataUnsafe?.user?.id }),
        }).then((res) => res.json());

        if (userData.user) {
          setUser(userData.user);
          setInviterInfo(userData.inviterInfo);
          setInviteLink(`http://t.me/pixel_dogs_bot/Pixel_dogs_web/start?startapp=${userData.user.telegramId}`);
          setInvitedUsers(
            (userData.user.invitedUsers || []).map((username: string) => ({
              username,
              totalPoints: 0,
              invitePoints: 0,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();

    intervalRef.current = setInterval(async () => {
      try {
        const invitedUsersData = await Promise.all(
          (invitedUsers || []).map(async (invitedUser) => {
            const userData = await prisma.user.findUnique({
              where: { username: invitedUser.username },
              select: { totalPoints: true, invitePoints: true },
            });
            return {
              ...invitedUser,
              totalPoints: userData?.totalPoints || 0,
              invitePoints: userData?.invitePoints || 0,
            };
          })
        );
        setInvitedUsers(invitedUsersData);
      } catch (error) {
        console.error('Error fetching invited users data:', error);
      }
    }, 1200000); // 20 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);

      // Increase points for the user
      await prisma.user.update({
        where: { telegramId: user.telegramId },
        data: {
          points: {
            increment: 2500,
          },
        },
      });

      setTimeout(() => {
        setIsCopied(false);
      }, 5000);
    } catch (error) {
      console.error('Error copying invite link:', error);
    }
  };

  return (
    <div>
      <h1>Invite your friends!</h1>
      <p>Earn 2,500 points for each friend you invite.</p>
      <button onClick={handleInvite}>
        {isCopied ? 'Invite link copied!' : 'Copy Invite Link'}
      </button>
      {user?.invitedBy && (
        <p>Invited by: {user.invitedBy}</p>
      )}
      {inviterInfo && (
        <div>
          <h2>Inviter's Total Points: {inviterInfo.totalPoints}</h2>
          <h2>Inviter's Invite Points: {inviterInfo.invitePoints}</h2>
        </div>
      )}
      <h2>Invited Friends</h2>
      <ul>
        {invitedUsers.map((invitedUser, index) => (
          <li key={index}>
            {invitedUser.username} - Total Points: {invitedUser.totalPoints}, Invite Points: {invitedUser.invitePoints}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InvitePage;
