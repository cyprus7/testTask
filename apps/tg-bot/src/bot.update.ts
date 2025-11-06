import { Update, Hears } from 'nestjs-telegraf'
import { Context, Markup } from 'telegraf'
import { ConfigService } from '@nestjs/config'

@Update()
export class BotUpdate {
    private readonly webAppUrl: string

    constructor(private readonly config: ConfigService) {
        this.webAppUrl = this.config.get<string>('PUBLIC_URL') ?? 'https://task20251104.test.chernov.us'
    }

    @Hears('/start')
    async onStart(ctx: Context) {
        await ctx.reply(
            'Привет! Это бот для открытия WebApp.',
            Markup.inlineKeyboard([
                [Markup.button.webApp('Открыть WebApp', this.webAppUrl)],
            ]),
        )
    }

    @Hears('/menu')
    async onMenu(ctx: Context) {
        await ctx.reply('WebApp:', {
            reply_markup: {
                keyboard: [[{ text: "Open App", web_app: { url: this.webAppUrl } }]],
                resize_keyboard: true,
                is_persistent: true
            }
        })
    }
}