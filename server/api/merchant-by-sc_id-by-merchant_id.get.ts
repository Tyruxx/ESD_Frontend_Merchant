export default defineEventHandler(async (event) => {
    try {
        const query = getQuery<Query>(event);
        type Query = {
            sc_id: number,
            merchant_id: number
        }
        type Merchant = {
            data: {
                merchant_id: number,
                sc_id: number,
                merchant_name: string,
                opening_time: string,
                closing_time: string,
                contact_number: string,
                email: string
            }
        }
        const merchant = await $fetch<Merchant>(`https://personal-0xujcjfg.outsystemscloud.com/merchant/rest/merchant/merchant/${query.sc_id}/${query.merchant_id}`);
        return merchant;
    } catch (error) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
})