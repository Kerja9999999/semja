require("dotenv").config();
const express=require("express");
const TelegramBot=require("node-telegram-bot-api");
const app=express();
const bot=new TelegramBot(process.env.BOT_TOKEN,{polling:true});
const states={};
bot.onText(/\/start/,(msg)=>{
  states[msg.chat.id]=null;
  bot.sendMessage(msg.chat.id,"🏠 Семейный бюджет\n\nНажмите «💰 Добавить расход».",
  {reply_markup:{keyboard:[["💰 Добавить расход"],["❌ Отмена"]],resize_keyboard:true}});
});
bot.on("message",(msg)=>{
 const id=msg.chat.id;
 const t=(msg.text||"").trim();
 if(t==="/start") return;
 if(t==="❌ Отмена"){delete states[id];return bot.sendMessage(id,"Отменено");}
 if(t==="💰 Добавить расход"){states[id]={step:"cat"};return bot.sendMessage(id,"Категория?",{reply_markup:{keyboard:[["🍔 Продукты"],["🚗 Транспорт"],["🏠 Дом"],["❌ Отмена"]],resize_keyboard:true}});}
 if(!states[id]) return;
 switch(states[id].step){
  case "cat":
   states[id].category=t; states[id].step="amount"; return bot.sendMessage(id,"Введите сумму:");
  case "amount":
   const a=parseFloat(t.replace(",","."));
   if(Number.isNaN(a)) return bot.sendMessage(id,"Введите число");
   states[id].amount=a; states[id].step="desc"; return bot.sendMessage(id,"Введите описание:");
  case "desc":
   const fs=require("fs");
   const p="./data/expenses.json";
   let arr=[]; try{arr=JSON.parse(fs.readFileSync(p,"utf8"));}catch{}
   arr.push({date:new Date().toISOString(),category:states[id].category,amount:states[id].amount,description:t});
   fs.writeFileSync(p,JSON.stringify(arr,null,2));
   delete states[id];
   return bot.sendMessage(id,"✅ Расход сохранён",
   {reply_markup:{keyboard:[["💰 Добавить расход"],["❌ Отмена"]],resize_keyboard:true}});
 }
});
app.get("/",(_,res)=>res.send("OK"));
app.listen(process.env.PORT||3000);
