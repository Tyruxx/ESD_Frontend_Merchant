export default defineEventHandler(async (event) => {
    try {
        const query = getQuery<Query>(event);
        type Query = {
            customer_id: number
        }
        type Orders = {
            data: {
                order_id: number,
                merchant_id: number,
                order_status: number,
                customer_plate: string,
                order_items: {
                    order_id: number,
                    item_id: number,
                    item_qty: number,
                    item_price: number
                }[],
                eta: string,
                order_time: string,
                sc_id: number,
                customer_id: number
            }[]
        }
        const orders = await $fetch<Orders>(`https://personal-0xujcjfg.outsystemscloud.com/order/rest/order/order/customer/${query.customer_id}`);
        return orders;
    } catch (error) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
})