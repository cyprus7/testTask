import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import crypto from "crypto";
import { loadEnv, optionalString, optionalUrl, z } from "@shared/config";

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
const webhookPath = process.env.TG_WEBHOOK_PATH || `/tg/${crypto.randomUUID()}`;

if (env.TG_WEBHOOK_URL) {
    const url = `${env.TG_WEBHOOK_URL}${webhookPath}`;
    const secretOptions = env.TG_WEBHOOK_SECRET ? { secret_token: env.TG_WEBHOOK_SECRET } : undefined;
    await bot.api.setWebhook(url, secretOptions);
    const handle = webhookCallback(bot, "std/http", env.TG_WEBHOOK_SECRET ? { secretToken: env.TG_WEBHOOK_SECRET } : {});
    // Bun serve for webhook handling (when running in Bun). If not running in Bun, the environment should provide an HTTP server.
    if (typeof Bun !== "undefined" && Bun.serve) {
        Bun.serve({
            port: Number(process.env.PORT || 8080),
            fetch(req) {
                const u = new URL(req.url);
                if (u.pathname === webhookPath) return handle(req);
                return new Response("ok");
            },
        });
        console.log(`Webhook set & server on :${process.env.PORT || 8080} path=${webhookPath}`);
    } else {
        console.log(`Webhook set at ${url}. Please configure an HTTP server to forward ${webhookPath} to the bot handler.`);
    }
} else {
    console.log("Starting long polling");
    bot.start();
}
