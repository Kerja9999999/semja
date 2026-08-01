
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

let requestWaiting = false;

// Гость нажал кнопку
app.post("/request-open", (req, res) => {
    requestWaiting = true;

    console.log("Новый запрос на открытие ворот");

    res.json({
        success: true,
        message: "Запрос отправлен"
    });
});

// ESP32 будет спрашивать сервер
app.get("/status", (req, res) => {

    if (requestWaiting) {

        requestWaiting = false;

        return res.json({
            open: true
        });

    }

    res.json({
        open: false
    });

});

app.listen(PORT, () => {
    console.log("Server started on port " + PORT);
});
