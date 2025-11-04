import { Bot, InlineKeyboard } from "grammy";
import { loadEnv, optionalString, optionalUrl, z } from "@shared-config";

const env = loadEnv(
    z.object({
        TG_BOT_TOKEN: z.string().min(1, "TG_BOT_TOKEN is required"),
        WEBAPP_URL: z.string().url("WEBAPP_URL must be a valid URL"),
        TG_WEBHOOK_URL: optionalUrl(),
        TG_WEBHOOK_SECRET: optionalString()
    })
);

const bot = new Bot(env.TG_BOT_TOKEN);

bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard().webApp("Open App", env.WEBAPP_URL);
    await ctx.reply("Открываю WebApp 👇", { reply_markup: keyboard });
});

bot.command("menu", async (ctx) => {
    await ctx.api.sendMessage(ctx.chat.id, "WebApp:", {
        reply_markup: {
            keyboard: [[{ text: "Open App", web_app: { url: env.WEBAPP_URL } }]],
            resize_keyboard: true,
            is_persistent: true
        }
    });
});

if (env.TG_WEBHOOK_URL) {
    const webhookPath = `/tg/${env.TG_BOT_TOKEN}`;
    const secretOptions = env.TG_WEBHOOK_SECRET
        ? { secret_token: env.TG_WEBHOOK_SECRET }
        : {};
    await bot.api.setWebhook(`${env.TG_WEBHOOK_URL}${webhookPath}`, secretOptions);
    console.log("Webhook set");
} else {
    console.log("Starting long polling");
    bot.start();
}
