import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const LEVELS = [
    { name: 'Rookie', threshold: 100, pointsPerHundredXP: 1 },
    { name: 'Bronze', threshold: 101, pointsPerHundredXP: 3 },
    { name: 'Silver', threshold: 300, pointsPerHundredXP: 5 },
    { name: 'Gold', threshold: 700, pointsPerHundredXP: 7 },
    { name: 'Diamond', threshold: 1100, pointsPerHundredXP: 10 },
    { name: 'Platinum', threshold: 1500, pointsPerHundredXP: 15 },
    { name: 'Infinite', threshold: Infinity, pointsPerHundredXP: 15 }
];

function calculateProfileMetrics(piAmountArray: number[]) {
    // Calculate total Pi sold
    const totalPiSold = piAmountArray.reduce((sum, amount) => sum + amount, 0);
    
    // Calculate XP (1 Pi = 1 XP)
    const xp = totalPiSold;
    
    // Calculate current level
    const currentLevel = LEVELS.findIndex(lvl => xp < lvl.threshold);
    const level = currentLevel === -1 ? LEVELS.length : currentLevel;
    
    // Calculate Pi points based on level and XP
    const pointsRate = LEVELS[level - 1]?.pointsPerHundredXP || LEVELS[LEVELS.length - 1].pointsPerHundredXP;
    const p
        // Handle level update if requested
        if (userData.updateLevel) {
            user = await prisma.user.update({
                where: { telegramId: userData.id },
                data: { 
                    level: userData.level
                }
            })
        }

        // Calculate profile metrics
        const metrics = calculateProfileMetrics(user.piAmount);

        // Return combined user data and metrics
        return NextResponse.json({
            ...user,
            ...metrics
        })
    } catch (error) {
        console.error('Error processing user data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
