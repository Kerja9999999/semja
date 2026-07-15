const path = require("path");
const { load, save } = require("./storage");

const FILE = path.join(__dirname, "../data/expenses.json");

function addExpense(chatId, category, amount, description) {
    const expenses = load(FILE);

    const expense = {
        id: Date.now(),
        chatId,
        category,
        amount: Number(amount),
        description,
        date: new Date().toISOString()
    };

    expenses.push(expense);

    save(FILE, expenses);

    return expense;
}

module.exports = {
    addExpense
};
