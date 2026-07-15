const menu = {
  reply_markup: {
    keyboard: [
      ["💰 Добавить расход", "💵 Добавить доход"],
      ["📊 Статистика", "📅 Сегодня"],
      ["📆 Неделя", "📈 Месяц"],
      ["⚙️ Настройки"]
    ],
    resize_keyboard: true,
    persistent_keyboard: true
  }
};

module.exports = menu;
