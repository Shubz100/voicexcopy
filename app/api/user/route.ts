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
    const totalPiSold = piAmountArray.reduce((sum, amount) => sum + amount, 0);
    const xp = totalPiSold;
    const currentLevel = LEVELS.findIndex(lvl => xp < lvl.threshold);
    const level = currentLevel === -1 ? LEVELS.length : currentLevel;
    const pointsRate = LEVELS[level - 1]?.pointsPerHundredXP || LEVELS[LEVELS.length - 1].pointsPerHundredXP;
    const piPoints = Math.floor(xp / 100) * pointsRate;

    return {
        totalPiSold,
        xp,
        level,
        piPoints
    };
}

function canInitiateNewTransaction(transactionStatus: string[]) {
    if (transactionStatus.length === 0) return true;
    const lastStatus = transactionStatus[transactionStatus.length - 1];
    return lastStatus === 'completed' || lastStatus === 'failed';
}

async function sendWelcomeMessage(botToken: string, chatId: number) {
    try {
        const WEBAPP_URL = "https://voicexcopy.vercel.app/";
        const keyboard = {
            inline_keyboard: [[{
                text: "Start Selling Pi✨",
                web_app: { url: WEBAPP_URL }
            }]]
        };

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: "Welcome to Pi Traders Official. Sell Your Coins Here",
                parse_mode: "HTML",
                reply_markup: keyboard
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send welcome message');
        }
    } catch (error) {
        console.error('Error sending welcome message:', error);
        // Don't throw error to prevent blocking the main flow
    }
}

export async function POST(req: NextRequest) {
    try {
        const userData = await req.json()

        if (!userData || !userData.id) {
            return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
        }

        const select = {
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
            level: true,
            piAmount: true,
            transactionStatus: true,
            totalPoints: true,
            introSeen: true,
            paymentMethod: true,
            paymentAddress: true,
            isUpload: true,
            imageUrl: true,
            savedImages: true,
            finalpis: true,
            baseprice: true,
            piaddress: true,
            istransaction: true,
        }

        let user = await prisma.user.findUnique({
            where: { telegramId: userData.id },
            select
        })

        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = await prisma.user.create({
                data: {
                    telegramId: userData.id,
                    username: userData.username || '',
                    firstName: userData.first_name || '',
                    lastName: userData.last_name || '',
                    level: 1,
                    transactionStatus: []
                },
                select
            })

            // Send welcome message for new users
            if (process.env.TELEGRAM_BOT_TOKEN) {
                await sendWelcomeMessage(
                    process.env.TELEGRAM_BOT_TOKEN,
                    parseInt(userData.id)
                );
            }
        }

        // Handle new transaction initiation
        if (userData.newTransaction) {
            if (!canInitiateNewTransaction(user.transactionStatus)) {
                return NextResponse.json({ 
                    error: 'Cannot start new transaction while previous transaction is processing'
                }, { status: 400 })
            }

            user = await prisma.user.update({
                where: { telegramId: userData.id },
                data: { 
                    transactionStatus: {
                        push: 'processing'
                    }
                },
                select
            })
        }

        // Handle transaction status update if provided
        if (userData.updateTransactionStatus) {
            const { index, status } = userData.updateTransactionStatus
            if (index >= 0 && ['processing', 'completed', 'failed'].includes(status)) {
                const newStatuses = [...user.transactionStatus]
                newStatuses[index] = status
                user = await prisma.user.update({
                    where: { telegramId: userData.id },
                    data: { 
                        transactionStatus: newStatuses
                    },
                    select
                })
            }
        }

        // Handle level update if requested
        if (userData.updateLevel) {
            user = await prisma.user.update({
                where: { telegramId: userData.id },
                data: { 
                    level: userData.level
                },
                select
            })
        }

        // Calculate profile metrics
        const metrics = calculateProfileMetrics(user.piAmount);

        // Return combined user data and metrics
        return NextResponse.json({
            ...user,
            ...metrics,
            status: user.transactionStatus,
            isNewUser
        })
    } catch (error) {
        console.error('Error processing user data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
