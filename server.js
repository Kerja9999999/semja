require("dotenv").config();
const userStates = require("./bot/states");
const expenseCategories = require("./bot/categories");
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
bot.on("message", (msg) => {

    if (msg.text === "💰 Добавить расход") {

        userStates[msg.chat.id] = {
            step: "category"
        };

        return bot.sendMessage(
            msg.chat.id,
            "Выберите категорию расхода:",
            expenseCategories
        );
    }

});
app.listen(PORT, () => {
  console.log(`🚀 Server started on ${PORT}`);
});
