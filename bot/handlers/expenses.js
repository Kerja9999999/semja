const states = require("../states");
const categories = require("../keyboards/categories");
const menu = require("../keyboards/menu");
const { addExpense } = require("../../services/expenseService");

module.exports = function (bot) {

    bot.on("message", (msg) => {

        const chatId = msg.chat.id;
        const text = msg.text;

        // Кнопка "Добавить расход"
        if (text === "💰 Добавить расход") {
            states[chatId] = {
                step: "category"
            };

            return bot.sendMessage(chatId, "Выберите категорию:", categories);
        }

        if (!states[chatId]) return;

        // Выбор категории
        if (states[chatId].step === "category") {

            states[chatId].category = text;
            states[chatId].step = "amount";

            return bot.sendMessage(chatId, "💶 Введите сумму:");
        }

        // Ввод суммы
        if (states[chatId].step === "amount") {

            if (isNaN(text.replace(",", "."))) {
                return bot.sendMessage(chatId, "Введите число.");
            }

            states[chatId].amount = Number(text.replace(",", "."));
            states[chatId].step = "description";

            return bot.sendMessage(chatId, "📝 Введите описание:");
        }

        // Ввод описания
        if (states[chatId].step === "description") {

            addExpense(
                chatId,
                states[chatId].category,
                states[chatId].amount,
                text
            );

            delete states[chatId];

            return bot.sendMessage(
                chatId,
                "✅ Расход успешно сохранен.",
                menu
            );
        }

    });

};
