So this is an more advance version of the notes app I made previously. 

I used :
- next js + supabase combo for frontend and backend
- cohere to embed the notes and then stored it in supabase pgvector store
- used groq for llm
- razorpay for payment(it doesn't work because I didn't create any accound on razorpay. Creating an account on razorpay is not a part of my job so I skipped it and focused on the code instead. The payment will work just fine once I replace the fake api tokens with actual razorpay tokens


I relied on AI yes but I tried my best to understand as much of the code as I could. This note app is not perfect, atleast it's not what I mind when it comes to understading the code. I tried my best to understand it and then compiled a list of things which I can do to improve this further :

* Fix payment flow with orders table
* Extract rate limiting into a src/lib/rateLimit.ts utility with a central LIMITS config

I am not going to make these changes because I want to move on from this project and implement what I learnt in my next project. I realised that I don't really like next js as backend so I am gonna use python as backend in upcomind projects

Here's the live demo link : https://project-3-notes-app.vercel.app/

Thank you for you time
