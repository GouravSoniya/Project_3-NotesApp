import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  // Verify the webhook is actually from Razorpay
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const userId = event.payload.payment.entity.receipt.split('_')[1]

    const supabase = await createClient()
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan: 'pro'
    }, { onConflict: 'user_id' })
  }

  return NextResponse.json({ received: true })
}