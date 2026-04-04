export default defineEventHandler(async (event) => {
    try {
        const query = getQuery<Query>(event);
        type Query = {
            merchant_id: number
        }
        type Items = {
            item_id: number,
            merchant_id: number,
            item_name: string,
            item_qty: number,
            item_price: number,
            is_on_sale: boolean
        }[]
        const shoppingCenters = await $fetch<Items>(`https://personal-0xujcjfg.outsystemscloud.com/inventory/rest/inventory/inventory/${query.merchant_id}`);
        return shoppingCenters;
    } catch (error) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
})