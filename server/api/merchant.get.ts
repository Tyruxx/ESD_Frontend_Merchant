export default defineEventHandler(async (event) => {
    try {
        const query = getQuery<Query>(event);
        type Query = {
            sc_id: number
        }
        type Merchants = {
            merchant_id: number,
            sc_id: number,
            merchant_name: string
        }[]
        const shoppingCenters = await $fetch<Merchants>(`https://personal-0xujcjfg.outsystemscloud.com/merchant/rest/merchant/merchant/${query.sc_id}`);
        return shoppingCenters;
    } catch (error) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
})