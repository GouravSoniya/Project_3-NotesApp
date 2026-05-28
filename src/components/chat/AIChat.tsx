'use client'
import { useState } from 'react'

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!message.trim() || loading) return

    const userMessage = message.trim()
    setHistory(prev => [...prev, { role: 'user', text: userMessage }])
    setMessage('')
    setLoading(true)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    })

    const data = await response.json()
    setLoading(false)

    if (data.reply) {
      setHistory(prev => [...prev, { role: 'ai', text: data.reply }])
    } else if (data.error) {
      setHistory(prev => [...prev, { role: 'ai', text: data.error }])
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center text-white text-xl transition-all"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)' }}
      >
        {isOpen ? '✕' : '✦'}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-28 right-8 w-96 h-[500px] rounded-2xl flex flex-col"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <div className="p-5 border-b border-white/10">
            <p className="text-white text-base font-medium">AI Assistant</p>
          </div>
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
            {history.length === 0 && (
              <p className="text-white/40 text-sm">Ask anything about your notes...</p>
            )}
            {history.map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-4 py-3 rounded-xl max-w-[90%] ${
                  msg.role === 'user' ? 'bg-white/20 text-white self-end' : 'bg-white/10 text-white/80 self-start'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bg-white/10 text-white/50 text-sm px-4 py-3 rounded-xl self-start">
                Thinking...
              </div>
            )}
          </div>
          <div className="p-4 border-t border-white/10">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
        </div>
      )}
    </>
  )
}