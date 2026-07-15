const states = require("../states");
const categories = require("../keyboards/categories");

module.exports = function (bot) {

    bot.on("message", (msg) => {

        if (msg.text !== "💰 Добавить расход") return;

        states[msg.chat.id] = {
            step: "category"
        };

        bot.sendMessage(
            msg.chat.id,
            "Выберите категорию:",
            categories
        );

    });

};
