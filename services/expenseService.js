const states = require("../states");
const categories = require("../keyboards/categories");
const menu = require("../keyboards/menu");
const { addExpense } = require("../../services/expenseService");

module.exports = function (bot) {

    bot.on("message", (msg) => {

        const chatId = msg.chat.id;
        const text = (msg.text || "").trim();

        // Игнорируем /start
        if (text === "/start") return;

        // Отмена
        if (text === "❌ Отмена") {
            delete states[chatId];
            return bot.sendMessage(chatId, "❌ Действие отменено.", menu);
        }

        // Начало добавления расхода
        if (text === "💰 Добавить расход") {
            states[chatId] = {
                step: "category"
            };

            return bot.sendMessage(
                chatId,
                "Выберите категорию:",
                categories
            );
        }

        // Если пользователь ничего не добавляет
        if (!states[chatId]) return;

        switch (states[chatId].step) {

            case "category":

                states[chatId].category = text;
                states[chatId].step = "amount";

                console.log("CATEGORY OK");

                return bot.sendMessage(
                    chatId,
                    "💶 Введите сумму:"
                );

            case "amount":

                console.log("AMOUNT =", text);

                const amount = parseFloat(
                    text.replace(",", ".")
                );

                if (Number.isNaN(amount)) {
                    return bot.sendMessage(
                        chatId,
                        "❌ Введите только число.\nНапример:\n20\nили\n20.50"
                    );
                }

                states[chatId].amount = amount;
                states[chatId].step = "description";

                console.log("AMOUNT OK");

                return bot.sendMessage(
                    chatId,
                    "📝 Введите описание:"
                );

            case "description":

                console.log("DESCRIPTION =", text);

                addExpense(
                    chatId,
                    states[chatId].category,
                    states[chatId].amount,
                    text
                );

                delete states[chatId];

                return bot.sendMessage(
                    chatId,
                    "✅ Расход сохранён.",
                    menu
                );

            default:

                delete states[chatId];

                return bot.sendMessage(
                    chatId,
                    "Произошла ошибка. Начните заново.",
                    menu
                );
        }

    });

};
