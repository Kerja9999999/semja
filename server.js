require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
});

require("./bot/handlers/start")(bot);
require("./bot/handlers/expenses")(bot);

app.get("/", (req, res) => {
    res.send("Semja Bot работает");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server started");
});
