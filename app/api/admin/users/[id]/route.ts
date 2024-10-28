import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/users/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    
    // Validate that all array inputs are properly formatted
    const piAmount = Array.isArray(data.piAmount) ? data.piAmount : [];
    const finalpis = Array.isArray(data.finalpis) ? data.finalpis : [];
    const savedImages = Array.isArray(data.savedImages) ? data.savedImages : [];

    const updatedUser = await prisma.user.update({
      where: {
        id: params.id
      },
      data: {
        points: parseInt(data.points.toString()),
        introSeen: Boolean(data.introSeen),
        paymentMethod: data.paymentMethod,
        paymentAddress: data.paymentAddress,
        isUpload: Boolean(data.isUpload),
        imageUrl: data.imageUrl,
        savedImages: savedImages,
        piAmount: piAmount,
        finalpis: finalpis,
        piaddress: data.piaddress,
        istransaction: Boolean(data.istransaction)
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
