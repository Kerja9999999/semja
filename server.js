const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const Stripe = require("stripe");
const axios = require("axios");
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
const { phone, credits, amount } = req.body;

```
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",

  line_items: [
    {
      price_data: {
        currency: "eur",
        product_data: {
         name: `${credits} CarWash Credits`
        },
        unit_amount: amount
      },
      quantity: 1
    }
  ],

metadata: {
  phone,
  credits
}

  success_url:
    "https://carwash-server-x53y.onrender.com/payment-success?session_id={CHECKOUT_SESSION_ID}",

  cancel_url:
    "https://carwash-server-x53y.onrender.com/payment-cancel"
});

res.json({
  url: session.url
});
```

} catch (error) {
res.status(500).json({
error: error.message
});
}
});

app.get("/payment-success", async (req, res) => {
  try {
console.log("PAYMENT SUCCESS ROUTE HIT");
    const sessionId = req.query.session_id;
    console.log("SESSION:", sessionId);
    if (!sessionId) {
      return res.send("Нет session_id");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("PHONE:", session.metadata.phone);
    // ЗАЩИТА ОТ ПОВТОРНОГО НАЧИСЛЕНИЯ

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("*")
      .eq("stripe_payment_id", sessionId)
      .maybeSingle();

    if (existingPayment) {
      return res.send("Кредиты уже были начислены");
    }

    const phone = session.metadata.phone;

    // ИЩЕМ ПОЛЬЗОВАТЕЛЯ В AWOARA

    const userResponse = await axios.get(
      "https://en.awoara.com.cn/mer/user/lst?page=1&limit=9999",
      {
        headers: {
          "x-token": process.env.AWOARA_TOKEN,
          "Cookie": process.env.AWOARA_COOKIE
        }
      }
    );

    const users = userResponse.data.data.list;

    const awoaraUser = users.find(
      u => String(u.phone) === String(phone)
    );

    if (!awoaraUser) {
      return res.send("Пользователь AWOARA не найден");
    }

    // НАЧИСЛЯЕМ 100 КРЕДИТОВ В AWOARA

    await axios.post(
      `https://en.awoara.com.cn/mer/user/change_now_money/${awoaraUser.uid}.html`,
      {
        money_type: 1,
        type: 1,
        now_money: Number(session.metadata.credits)
        mark: "Stripe payment"
      },
      {
        headers: {
          "x-token": process.env.AWOARA_TOKEN,
          "Cookie": process.env.AWOARA_COOKIE
        }
      }
    );

    // СОХРАНЯЕМ ОПЛАТУ

console.log("BEFORE SAVE");
console.log("sessionId =", sessionId);
console.log("phone =", phone);
console.log("uid =", awoaraUser.uid);

const { data, error } = await supabase
  .from("payments")
  .insert([
    {
      stripe_payment_id: sessionId,
      phone: phone,
      uid: awoaraUser.uid,
      amount: 1
    }
  ]);


    return res.send(
      `Оплата успешна. Пользователь ${phone} получил 100 кредитов.`
    );

  } catch (error) {

    return res.status(500).send(
      error.response?.data?.message ||
      error.message
    );

  }
});

app.get("/payment-cancel", (req, res) => {
res.send("Оплата отменена");
});
app.get("/awoara-users", async (req, res) => {
  try {
    const response = await axios.get(
      "https://en.awoara.com.cn/mer/user/lst?page=1&limit=9999",
      {
        headers: {
          "x-token": process.env.AWOARA_TOKEN,
          "Cookie": process.env.AWOARA_COOKIE
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

app.get("/awoara-users", async (req, res) => {
  try {
    const response = await axios.get(
      "https://en.awoara.com.cn/mer/user/lst?page=1&limit=9999",
      {
        headers: {
          "x-token": process.env.AWOARA_TOKEN,
          "Cookie": process.env.AWOARA_COOKIE
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    res.status(500).json({
      error: error.message,
      details: error.response?.data || null
    });

  }
});
app.get("/awoara-add-test", async (req, res) => {
  try {

    const response = await axios.post(
      "https://en.awoara.com.cn/mer/user/change_now_money/267.html",
      {
        money_type: 1,
        type: 1,
        now_money: 1,
        mark: "Render test"
      },
      {
        headers: {
          "x-token": process.env.AWOARA_TOKEN,
          "Cookie": process.env.AWOARA_COOKIE
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });

  }
});
app.get("/awoara-users", async (req, res) => {

});

app.get("/awoara-find/:phone", async (req, res) => {
  try {

    const phone = req.params.phone;

    const response = await axios.get(
      "https://en.awoara.com.cn/mer/user/lst?page=1&limit=9999",
      {
        headers: {
          "x-token": process.env.AWOARA_TOKEN,
          "Cookie": process.env.AWOARA_COOKIE
        }
      }
    );

    const users = response.data.data.list;

    const user = users.find(
      u => String(u.phone) === String(phone)
    );

    if (!user) {
      return res.json({
        found: false
      });
    }

    res.json({
      found: true,
      uid: user.uid,
      phone: user.phone,
      nickname: user.nickname
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.post("/awoara-topup", async (req, res) => {
  try {

    const { uid, credits } = req.body;

    const response = await axios.post(
      `https://en.awoara.com.cn/mer/user/change_now_money/${uid}.html`,
      {
        money_type: 1,
        type: 1,
        now_money: credits,
        mark: "Stripe payment"
      },
      {
        headers: {
          "x-token": process.env.AWOARA_TOKEN,
          "Cookie": process.env.AWOARA_COOKIE
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
app.get("/test-topup", async (req, res) => {
  try {

    const response = await axios.post(
      "https://en.awoara.com.cn/mer/user/change_now_money/267.html",
      {
        money_type: 1,
        type: 1,
        now_money: 10,
        mark: "Stripe test"
      },
      {
        headers: {
          "x-token": process.env.AWOARA_TOKEN,
          "Cookie": process.env.AWOARA_COOKIE
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    res.status(500).json({
      error: error.message,
      details: error.response?.data || null
    });

  }
});
app.get("/buy-test", async (req, res) => {

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
          unit_amount: 100
        },
        quantity: 1
      }
    ],

metadata: {
  phone,
  credits
}

    success_url:
      "https://carwash-server-x53y.onrender.com/payment-success?session_id={CHECKOUT_SESSION_ID}",

    cancel_url:
      "https://carwash-server-x53y.onrender.com/payment-cancel"
  });

  res.redirect(session.url);

});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`Server started on ${PORT}`);
});
