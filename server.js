require("dotenv").config();
const menu = require("./bot/menu");
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
  bot.sendMessage(
    msg.chat.id,
    "🏠 Семейный бюджет\n\nВыберите действие:",
    menu
  );
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on ${PORT}`);
});
