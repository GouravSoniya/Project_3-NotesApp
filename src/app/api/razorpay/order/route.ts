import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return mock order in development since we have fake keys
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      orderId: `order_mock_${Date.now()}`,
      amount: 19900
    })
  }

  try {
    const order = await razorpay.orders.create({
      amount: 19900,
      currency: 'INR',
      receipt: `receipt_${user.id}_${Date.now()}`,
    })
    return NextResponse.json({ orderId: order.id, amount: order.amount })
  } catch (err) {
    console.error('Razorpay order creation failed:', err)
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
  }
}