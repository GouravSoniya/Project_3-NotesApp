So this is an more advance version of the notes app I made previously. 

I used :
- next js + supabase combo for frontend and backend
- cohere to embed the notes and then stored it in supabase pgvector store
- used groq for llm
- razorpay for payment(it doesn't work because I didn't create any accound on razorpay. Creating an account on razorpay is not a part of my job so I skipped it and focused on the code instead. The payment will work just fine once I replace the fake api tokens with actual razorpay tokens


I relied on AI yes but I tried my best to understand as much of the code as I could. This note app is not perfect, atleast it's not what I mind when it comes to understading the code. I tried my best to understand it and then compiled a list of things which I can do to improve this further :

* Convert route handlers to server actions
* Fix payment flow with orders table
* Delete the API key log
* Fix hardcoded localhost
* Fix middleware naming + handle /api/ routes returning 401 instead of redirect (then remove individual auth checks from route handlers)
* Split NotesApp into smaller components
* Extract rate limiting into a src/lib/rateLimit.ts utility with a central LIMITS config

I am not going to make these changes because I want to move on from this project and implement what I learnt in my next project. I realised that I don't really like next js as backend so I am gonna use python as backend in upcomind projects

Thank you for you time
