import { z } from "zod";

const toOptional = (value?: string | null) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : undefined;
};

export const optionalString = () =>
    z
        .string()
        .optional()
        .transform(toOptional);

export const optionalUrl = () =>
    optionalString().superRefine((value, ctx) => {
        if (!value) return;
        try {
            new URL(value);
        } catch {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid URL" });
        }
    });

export function loadEnv<T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    source: Record<string, string | undefined> = process.env
) {
    return schema.parse(source);
}

export { z };
