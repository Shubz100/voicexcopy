// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        // Get admin key from Authorization header
        const authHeader = req.headers.get('Authorization')
        const adminKey = authHeader?.replace('Bearer ', '')

        // Basic admin authentication
        if (adminKey !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all users with transactions
        const users = await prisma.user.findMany({
            where: {
                piAmount: {
                    isEmpty: false
                }
            },
            select: {
                telegramId: true,
                username: true,
                piAmount: true,
                transactionStatus: true,
                paymentMethod: true,
                paymentAddress: true
            }
        })

        return NextResponse.json({ users })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
