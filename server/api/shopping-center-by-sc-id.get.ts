export default defineEventHandler(async (event) => {
    try {
        const query = getQuery<Query>(event);
        type Query = {
            sc_id: number
        }
        type ShoppingCenter = {
            sc_name: string,
            sc_id: number,
            sc_address: string,
            sc_loading_slots: string
        }
        const shoppingCenter = await $fetch<ShoppingCenter>(`https://personal-0xujcjfg.outsystemscloud.com/shopping_center/rest/shopping_center/shopping_center/${query.sc_id}`);
        return shoppingCenter;
    } catch (error) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
})