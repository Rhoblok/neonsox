import express from "express"
import cors from "cors"
import Stripe from "stripe"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Frontend base URL for Stripe redirects. Override with FRONTEND_URL in .env for production.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174"

app.post("/api/checkout", async (req, res) => {
  const { priceId, mode } = req.body

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${FRONTEND_URL}/success`,
      cancel_url: `${FRONTEND_URL}/pricing`,
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(4242, () => {
  console.log("Backend running on http://localhost:4242")
})