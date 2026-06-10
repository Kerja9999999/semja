const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const Stripe = require("stripe");

const app = express();

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.get("/", (req, res) => {
  res.send("CarWash API работает");
});

app.get("/users", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*");

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});

app.post("/register", async (req, res) => {
  const { name, phone, washbox } = req.body;

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        name,
        phone,
        credits: 0,
        washbox: washbox || 1
      }
    ])
    .select();

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});

app.get("/stripe-test", async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    res.json(balance);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/create-payment", async (req, res) => {
  try {
    const { phone } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "100 CarWash Credits"
            },
            unit_amount: 50 // 1 евро
          },
          quantity: 1
        }
      ],

      metadata: {
        phone: phone
      },

      success_url:
        "https://carwash-server-x53y.onrender.com/payment-success?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        "https://carwash-server-x53y.onrender.com/payment-cancel"
    });

    res.json({
      url: session.url
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.get("/payment-success", async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.send("Нет session_id");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    const { data: existingPayment } = await supabase
  .from("payments")
  .select("*")
  .eq("stripe_payment_id", sessionId)
  .single();

if (existingPayment) {
  return res.send("Кредиты уже были начислены");
}

    const phone = session.metadata.phone;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (userError || !user) {
      return res.send("Пользователь не найден");
    }

    const newCredits = (user.credits || 0) + 100;

    const { error } = await supabase
      .from("users")
      .update({
        credits: newCredits
      })
      .eq("phone", phone);

    if (error) {
      return res.status(500).send(error.message);
    }
await supabase
  .from("payments")
  .insert([
    {
      stripe_payment_id: sessionId,
      amount: 1
    }
  ]);
    res.send(
      `Оплата успешна! Пользователю ${phone} начислено 100 кредитов. Теперь кредитов: ${newCredits}`
    );

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/payment-cancel", (req, res) => {
  res.send("Оплата отменена");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});
