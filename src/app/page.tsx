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
        redirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/callback`
      }
    })
    if (data.url) redirect(data.url)
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  if (!user) {
    return (
      <Background>
        <main className="min-h-screen flex items-center justify-center">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="px-6 py-3 rounded-full text-white text-sm transition-colors hover:text-white/80"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Sign in with Google
            </button>
          </form>
        </main>
      </Background>
    )
  }

  return (
    <Background>
      <NotesApp user={{ id: user.id, email: user.email! }} signOut={signOut} />
    </Background>
  )
}