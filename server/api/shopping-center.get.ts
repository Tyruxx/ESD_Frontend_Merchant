export default defineEventHandler(async (event) => {
    try {
        type ShoppingCenters = {
            sc_name: string,
            sc_id: number,
            sc_address: string,
            sc_loading_slots: string
        }[]
        const shoppingCenters = await $fetch<ShoppingCenters>("https://personal-0xujcjfg.outsystemscloud.com/shopping_center/rest/shopping_center/shopping_center");
        return shoppingCenters;
    } catch (error) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
})