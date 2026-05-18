import { createClient } from '@/lib/supabase/server'
import NotesApp from '@/components/NotesApp'
import Background from '@/components/BackGround'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signInWithGoogle() {
    'use server'
    const supabase = await createClient()
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    if (data.url) redirect(data.url)
  }

  if (!user) {
    return (
      <Background>
        <main className="min-h-screen flex items-center justify-center">
          <form action={signInWithGoogle}>
            <button type="submit" className="text-white">Sign in with Google</button>
          </form>
        </main>
      </Background>
    )
  }

  return (
    <Background>
      <NotesApp user={{ id: user.id, email: user.email! }} />
    </Background>
  )
}