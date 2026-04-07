export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const merchantId = query.merchantId

  if (!merchantId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Merchant ID' })
  }

  try {
    return await $fetch(`http://40.83.77.78:8000/api/merchant/pickup/${merchantId}`, {
      headers: {
        'apiKey': config.merchantManagementServiceApiKey
      }
    })
  } catch (error: any) {
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: 'External API Fetch Failed'
    })
  }
})