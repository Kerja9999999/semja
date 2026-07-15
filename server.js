require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

app.get("/", (req, res) => {
  res.send("✅ Semja Bot работает");
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🏠 Добро пожаловать в Семейный бюджет!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on ${PORT}`);
});
