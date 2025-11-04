export type TelegramUserId = number;

export interface TelegramUser {
    id: TelegramUserId;
    username?: string;
    firstName?: string;
    lastName?: string;
}
