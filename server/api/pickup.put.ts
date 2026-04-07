export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  try {
    return await $fetch(`http://40.83.77.78:8000/api/merchant/pickup`, {
      method: 'PUT',
      headers: {
        'apiKey': config.merchantManagementServiceApiKey
      },
      body: body
    })
  } catch (error: any) {
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: 'External API Update Failed'
    })
  }
})