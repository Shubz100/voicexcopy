import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { telegramId, transactionIndex, newStatus, adminKey } = await req.json()

        // Basic admin authentication - store this in environment variables
        if (adminKey !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { telegramId: parseInt(telegramId) }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update the status for the specific transaction
        const newStatuses = [...user.transactionStatus]
        newStatuses[transactionIndex] = newStatus

        // Update user record
        const updatedUser = await prisma.user.update({
            where: { telegramId: parseInt(telegramId) },
            data: {
                transactionStatus: newStatuses
            }
        })

        return NextResponse.json({
            success: true,
            user: updatedUser
        })
    } catch (error) {
        console.error('Error updating transaction status:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
