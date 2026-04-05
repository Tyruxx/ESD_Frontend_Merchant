export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        type SubmitOrderResponse = {
            payment_url: string,
            order_id: number
        }
        const payload = {
            merchant_id: body.merchant_id,
            customer_plate: body.customer_plate,
            customer_id: body.customer_id,
            payment_method: body.payment_method,
            item_list: body.item_list, // Ensure this matches the API exactly
            eta: body.eta
        }
        const SubmitOrderResponse = await $fetch<SubmitOrderResponse>("https://personal-9otexixp.outsystemscloud.com/SubmitOrder/rest/SubmitOrder/SubmitOrder", {
            method: 'POST',
            body: payload
        });
        return SubmitOrderResponse;
    } catch (error) {
        throw createError({ statusCode: 500, statusMessage: 'Submit Order Failed' })
    }
})