export default defineEventHandler(async (event) => {
    try {
        type VerifyOrderRequest = {
            OrderId: number,
            MerchantId: number,
            ScId: number,
            SessionId: string
        }
        const body = await readBody<VerifyOrderRequest>(event);
        type VerifyOrderResponse = {
            order_id: number,
            merchant_id: number,
            order_status: number,
            customer_plate: string,
            eta: string,
            order_time: string,
            sc_id: number
        }
        const verifyOrderResponse = await $fetch<VerifyOrderResponse>("https://personal-9otexixp.outsystemscloud.com/VerifyOrder/rest/VerifyOrder/VerifyOrder", {
            method: 'PUT',
            body: {
                StripeSessionId: body.SessionId,
                OrderId: body.OrderId,
                MerchantId: body.MerchantId,
                ScId: body.ScId
            }
        });
        return verifyOrderResponse;
    } catch (error) {
        throw createError({ statusCode: 500, statusMessage: 'Verify Order Failed' })
    }
})