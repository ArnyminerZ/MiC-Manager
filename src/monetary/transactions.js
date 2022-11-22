import {Stripe} from 'stripe';
import {info, log, warn} from "../../cli/logger.js";
import {query} from "../request/database.js";

const stripe = new Stripe(process.env.STRIPE_SECRET, {});

export const checkPayments = async () => {
    /** @type {{Id:number,Grade:number,Price:number,StepIndex:number,Year:number,Liquidation:Date|null,GradeDisplayName:string}[]} */
    const pricing = await query('SELECT mGradesPricing.*, mG.DisplayName as GradeDisplayName FROM mGradesPricing LEFT JOIN mGrades mG on mGradesPricing.Grade = mG.Id;');
    log('There are', pricing.length, 'pricing elements.');

    const stripePrices = (await stripe.prices.list({limit: 50, active: true})).data;

    let checkedPrices = [];
    for (let price of pricing) {
        const stripePrice = stripePrices.find(p => p.metadata['db_id'] === price.Id.toString());
        if (stripePrice == null) {
            const newPrice = await stripe.prices.create({
                // TODO: Get currency from Firefly
                currency: 'eur',
                unit_amount: price.Price,
                product_data: {
                    name: `${price.GradeDisplayName} Payment #${price.StepIndex} (${price.Year})`,
                },
                metadata: {
                    db_id: price.Id,
                    grade: price.Grade,
                    price: price.Price,
                    step: price.StepIndex,
                    year: price.Year,
                    liquidation: price.Liquidation,
                },
            });
            info('Created new price:', newPrice.id);
            checkedPrices.push(newPrice.id);
        } else
            checkedPrices.push(stripePrice.id);
    }

    // Remove unrelated prices
    for (let stripePrice of stripePrices) {
        if (checkedPrices.includes(stripePrice.id)) continue;
        warn('Removing dangling price. Id:', stripePrice.id);
        await stripe.prices.update(stripePrice.id, {active: false});
    }
};
