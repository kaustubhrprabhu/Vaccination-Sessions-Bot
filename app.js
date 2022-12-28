const { Telegraf } = require("telegraf");
const axios = require("axios");
const bot = new Telegraf("TELEGRAM_BOT_TOKEN");

var pincode = "";
var date, tdate;
var hearText = false;

bot.start(async ctx => {
    const name = ctx.from.first_name;
    hearText = false;
    await ctx.replyWithSticker(
        "CAACAgIAAxkBAAEDZ9NhqYtYyWhf2m3ceck6rXL18SBmSwACkwADmL-ADa9H5EVlPDTbIgQ"
    );

    await ctx.reply(`
👋 Hello ${name},

I can help you to find available vaccination sessions near you.

🔍 To find, send me the command: /find
`);
});

bot.command("find", ctx => {
    hearText = true;
    ctx.reply("OK. Send me a PIN code");
});

bot.on("text", ctx => {
    if (hearText) {
        pincode = ctx.message.text;
        //console.log(pincode);

        let presMonth = new Date().getMonth() + 1;
        date = new Date().getDate() + "-" + presMonth + "-" + new Date().getFullYear();
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        let tMonth = tomorrow.getMonth() + 1;
        tdate = tomorrow.getDate() + "-" + tMonth + "-" + tomorrow.getFullYear();

        ctx.reply("Select a date for a session 👇", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: date, callback_data: "today" }],
                    [{ text: tdate, callback_data: "tomorrow" }]
                ]
            }
        });
        hearText = false;
    }
});

async function performAction(ctx, date) {
    await ctx.editMessageText("Please wait...");
    hearText = false;
    if (pincode == "") {
        hearText = true;
        ctx.editMessageText("Something went wrong. Please enter the PIN code again");
    } else {
        let url = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=" + pincode + "&date=" + date;
        await axios.get(url)
            .then(response => {
                if (response.data.sessions.length == 0) {
                    ctx.editMessageText("No sessions available at this time");
                } else {
                    ctx.deleteMessage();
                    for (let dataObj in response.data.sessions) {
                        ctx.reply(
                            `
🏥 <b>${response.data.sessions[dataObj].name}</b>
<b>${response.data.sessions[dataObj].address}, ${response.data.sessions[dataObj].district_name}, ${response.data.sessions[dataObj].state_name} ${pincode}</b>

<b>Date:</b> <i>${response.data.sessions[dataObj].date}</i>
<b>Vaccine:</b> <i>${response.data.sessions[dataObj].vaccine} (${response.data.sessions[dataObj].fee_type})</i>
<b>First Dose:</b> <i>${response.data.sessions[dataObj].available_capacity_dose1} slots</i>
<b>Second Dose:</b> <i>${response.data.sessions[dataObj].available_capacity_dose2} slots</i>

<a href="https://bit.ly/30UcfY6">Click here to book your slot</a>
                            `,
                            { parse_mode: "HTML" }
                        );
                    }
                }
            })
            .catch(error => {
                if (error.response.status == 400) {
                    ctx.editMessageText("Invalid PIN code 😒");
                } else if (error.response.status == 500) {
                    ctx.editMessageText("Internal server error. Please try again later");
                } else {
                    ctx.editMessageText("Something went wrong. Can't find the sessions");
                }
            });
    }
}

bot.action("today", ctx => performAction(ctx, date));
bot.action("tomorrow", ctx => performAction(ctx, tdate));

bot.launch();