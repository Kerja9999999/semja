const menu = require("../keyboards/menu");

module.exports = function (bot) {

    bot.onText(/\/start/, (msg) => {

        bot.sendMessage(
            msg.chat.id,
            "🏠 Семейный бюджет\n\nВыберите действие:",
            menu
        );

    });

};
