import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const stripeConfigSchema = Joi.object({
    STRIPE_SECRET_KEY: Joi.string().required(),
    STRIPE_WEBHOOK_SECRET: Joi.string().required(),

    STRIPE_PRICE_PREMIUM_MONTHLY: Joi.string().optional(),
    STRIPE_PRICE_PREMIUM_YEARLY: Joi.string().optional(),

    MERCADOPAGO_ACCESS_TOKEN: Joi.string().optional(),
    MERCADOPAGO_WEBHOOK_SECRET: Joi.string().optional(),
});

export const stripeConfig = registerAs('stripe', () => ({
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    prices: {
        premiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
        premiumYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    },
    mercadopago: {
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    },
}));