So this is an more advance version of the notes app I made previously. it has everything :
- next js
- supabase
- auth with google sign
- zustand
- ai chat bot
- rag pipeline
- stripe for payments

I used :
- next js + supabase combo for frontend and backend
- cohere to embed the notes and then stored it in supabase pgvector store
- used groq for llm
- stripe for payment(it's in test mode)

I originally used razorpay but razorpay don't give us test keys without the KYC but stripe give us that right after login so I chose that, besides it doesn't matter which payment gateway I choose all of them are pretty same.

A confession - i relied on AI but I do understand the overall architecture and I was consiciously and actively involved in taking decisions for the backend and frontend.

Here's the live demo link : https://project-3-notes-app.vercel.app/

NOTE - you can test the payment using a test card:

    Card number: 4242 4242 4242 4242
    Expiry: any future date e.g. 12/26
    CVC: any 3 digits e.g. 123

any email and fullname, doesn't matter the payment will happen

Thank you for you time
