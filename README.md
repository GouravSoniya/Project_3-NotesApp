# Notes App — AI-Native Note Taking

A notes app where the notes themselves are searchable by *meaning*, not just keywords — you can ask it questions and it answers from what you've actually written, instead of you scrolling to find it.

**Live demo:** https://project-3-notes-app.vercel.app/

Test the payment flow with a test card (Stripe test mode):
```
Card number: 4242 4242 4242 4242
Expiry: any future date, e.g. 12/26
CVC: any 3 digits, e.g. 123
```
Any email/name works — no real charge happens.

---

## The Problem

Most notes apps are just storage. You write something down, and finding it again later means remembering the right keyword, or scrolling. As the number of notes grows, that gets worse, not better.

I wanted a notes app that could answer questions like *"what did I decide about the pricing model last month?"* — without me remembering which note it was in, or what I titled it.

That's a retrieval problem, not a storage problem. So the interesting engineering here isn't the CRUD around notes — it's how the notes get embedded, stored, and retrieved so an LLM can answer from them accurately.

---

## Architecture, and why each piece is there

| Layer | Choice | Why |
|---|---|---|
| Frontend + Backend | Next.js + Supabase | One stack for auth, DB, and API routes — avoids stitching together three separate services for a solo project. |
| Auth | Supabase Auth (Google sign-in) | Users shouldn't have to make a new password for a notes app. Lower friction to actually test the demo. |
| State | Zustand | Simpler than Redux for the amount of client state this app actually has — no boilerplate for what's essentially a few global flags and the current note. |
| Embeddings | Cohere | Notes get embedded on save, so semantic search and the chatbot can retrieve by meaning, not exact text match. |
| Vector store | Supabase pgvector | Kept embeddings in the same Postgres instance as everything else instead of standing up a separate vector DB (Pinecone, etc.) — one less service to run, one less thing to keep in sync, and the note metadata + its embedding live in the same row. |
| LLM | Groq | Needed fast inference for the chat to feel conversational rather than laggy — Groq's speed mattered more here than marginal quality differences between models. |
| Payments | Stripe (test mode) | Originally planned Razorpay, since it's the standard in India — but Razorpay withholds test keys until KYC is complete, which blocks local development entirely. Stripe gives test keys immediately after signup. Since the payment gateway is an implementation detail and not something the product depends on, I optimized for the one that let me keep building instead of waiting on a KYC process. |

---

## How the RAG pipeline actually works

1. On save, a note's content is chunked and sent to Cohere for embedding.
2. The embedding is stored in Supabase's pgvector column alongside the note.
3. When the user asks the chatbot a question, the question is embedded the same way, and pgvector does a similarity search to pull the most relevant note chunks.
4. Those chunks are passed to Groq as context, so the answer is grounded in what the user actually wrote — not the model's general knowledge.

This means the chatbot can answer "what did I write about X" accurately even if the user doesn't remember the exact note title or wording.

---

## What I'd build next

- Chunking is currently per-note; for longer notes, smarter chunking (by paragraph/heading) would improve retrieval precision.
- No feedback loop yet on whether retrieved chunks were actually relevant — a thumbs up/down on chat answers would let me tune retrieval over time.
- Payments are in Stripe test mode; a production version would need the actual India-compliant gateway decision revisited (Razorpay, once KYC is done, or Stripe's India availability).

---

## Tech Stack

- **Frontend/Backend:** Next.js, Supabase
- **Auth:** Supabase Auth (Google OAuth)
- **State management:** Zustand
- **Embeddings:** Cohere
- **Vector store:** Supabase pgvector
- **LLM:** Groq
- **Payments:** Stripe (test mode)
- **Hosting:** Vercel

---

## A note on how this was built

I'm stronger on system design than on syntax, and I used AI tooling to help write code — but the architecture decisions (why pgvector over a separate vector DB, why Stripe over Razorpay, how the RAG pipeline is structured) were mine. This project was where I proved to myself I could take a product idea through the full stack — backend, frontend, AI pipeline, and payments — end to end.
