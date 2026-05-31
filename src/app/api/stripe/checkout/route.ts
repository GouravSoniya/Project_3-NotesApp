import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'inr',
          unit_amount: 19900,
          product_data: {
            name: 'Notes App Pro',
            description: 'Unlimited notes + AI messages',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/`,
  })

  return NextResponse.json({ url: session.url })
}