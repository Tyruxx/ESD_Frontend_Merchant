<script lang="ts" setup>
// import { ChevronLeft } from 'lucide-vue-next'
// import { Button } from '@/components/ui/button'
// import { Spinner } from '@/components/ui/spinner'

// definePageMeta({
//   middleware: ['auth'],
// })
// const { loggedIn, session, user: userSession, clear: clearSession, fetch: refreshSession } = useUserSession()
// const userSessionUsable = computed(() => {
//   return userSession.value as Record<string, any>
// })
// const userSessionPictureUsable = computed<string>(() => {
//   return userSessionUsable.value.picture ?? ''
// })

// const stateConvertFrom = useState('convert-from', () => '')
// const stateConvertTo = useState('convert-to', () => '')
// const convertFrom = computed(() => stateConvertFrom.value)
// const convertTo = computed(() => stateConvertTo.value)
// const { data: countryFrom } = await useFetch<Country[]>(() => `https://restcountries.com/v3.1/currency/${convertFrom.value}`, { watch: [convertFrom] })
// const { data: countryTo } = await useFetch<Country[]>(() => `https://restcountries.com/v3.1/currency/${convertTo.value}`, { watch: [convertTo] })
// const { data: tempStr } = await useFetch<CurrencyMap>(`/api/currency-list`)
// type Country = {
//   flags: {
//     png: string
//   }
//   name: {
//     common: string
//   }
//   cca2: string
// }
// type CurrencyMap = Record<string, string>

// // conversion props and logic
// function getCountryImg(from: boolean, convertFromTo?: Country[]) {
//   if (((convertFromTo)?.length ?? 0) > 1) {
//     if (
//       (from === true && convertFrom.value === 'EUR')
//       || (from === false && convertTo.value === 'EUR')
//     ) { return 'https://flagcdn.com/w320/eu.png' }
//     if (
//       (from === true && convertFrom.value === 'USD')
//       || (from === false && convertTo.value === 'USD')
//     ) { return 'https://flagcdn.com/w320/us.png' }
//     if (
//       (from === true && convertFrom.value === 'SGD')
//       || (from === false && convertTo.value === 'SGD')
//     ) { return 'https://flagcdn.com/w320/sg.png' }
//   }
//   return convertFromTo?.[0]?.flags.png
// }
// const countryFromImg = computed(() => {
//   return getCountryImg(true, countryFrom.value) ?? ''
// })
// const countryToImg = computed(() => {
//   return getCountryImg(false, countryTo.value) ?? ''
// })
// const countryFromStr = computed(() => {
//   return tempStr.value?.[`${convertFrom.value}`] ?? ''
// })
// const countryToStr = computed(() => {
//   return tempStr.value?.[`${convertTo.value}`] ?? ''
// })
// const countryFromFallback = convertFrom
// const countryToFallback = convertTo

// // chart props and logic
// function getPastDates(range: number, offsetDays: number): string[] {
//   const result: string[] = []

//   const today = new Date()

//   const start = new Date(Date.UTC(
//     today.getUTCFullYear(),
//     today.getUTCMonth(),
//     today.getUTCDate() - offsetDays,
//   ))

//   for (let i = 0; i < range; i += 1) {
//     const d = new Date(start)
//     d.setUTCDate(start.getUTCDate() - i)

//     const yyyy = d.getUTCFullYear()
//     const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
//     const dd = String(d.getUTCDate()).padStart(2, '0')

//     result.push(`${yyyy}-${mm}-${dd}`)
//   }

//   return result
// }
// type testStrType = {
//   finalArray: [number, string][]
//   finalStr: string
//   rateDelta: number
//   collectionArray: [number, string, string, string][]
// }

// type aiResultType = {
//   cardTitle: string
//   rateDelta: number
//   explanationString: string
//   chartArray: [number, number, number, string][]
// } | {
//   geminiOverload: string
// }

// const testStr = useState<testStrType | null>('past-data', () => null)
// const loading = ref(false)
// const fetchError = ref<unknown>(null)
// const aiResult = useState<aiResultType | null>('ai-result', () => null)

// const range = useState<number>('range', () => 7)
// const maxRetries = 10 // safety cap so don't loop forever

// async function fetchWithRetries() {
//   loading.value = true
//   fetchError.value = null
//   testStr.value = null

//   for (let offsetDays = 0; offsetDays < maxRetries; offsetDays++) {
//     const dates = getPastDates(range.value, offsetDays)
//     const stateDate = useState('dates', () => dates)
//     try {
//       var data = await $fetch<testStrType>('/api/exchange-rate', {
//         query: {
//           base: convertFrom.value,
//           currency: convertTo.value,
//           dates,
//         },
//       })
//     }
//     catch (err) {
//       continue
//     }
//     const payload = data as any
//     if (payload && 'errors' in payload) {
//       continue
//     }

//     testStr.value = data ?? null
//     loading.value = false
//     return
//   }

//   fetchError.value = new Error('Failed after retries')
//   loading.value = false
// }

// watch([convertFrom, convertTo, range], async (_, __, onCleanup) => {
//   const controller = new AbortController()
//   onCleanup(() => controller.abort())
//   aiResult.value = null
//   if (stateConvertFrom.value !== '' && stateConvertTo.value !== '') {
//     if (range.value == 1) {
//       range.value = 7
//     }
//     await fetchWithRetries()

//     // gemini ai api setup
//     async function callGemini() {
//       const response = await $fetch<string>('/api/gemini', {
//         method: 'POST',
//         body: {
//           pastData: testStr.value,
//           base: stateConvertFrom.value,
//           currency: stateConvertTo.value,
//           user: userSession.value,
//         },
//         signal: controller.signal,
//       })
//       return response
//     }
//     const response = await callGemini()
//     // gemini ai response
//     aiResult.value = JSON.parse(response)
//   }
//   else {
//     if (stateConvertFrom.value == '' || stateConvertTo.value == '') {
//       range.value = 1
//       await fetchWithRetries()
//     }
//   }
// }, { immediate: true })
// async function logOut() {
//   await clearSession()
//   await navigateTo('https://starnote.alan-sebastian-bun.com/login', { external: true })
// }
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
  } from '@/components/ui/input-group';
  import { SearchIcon } from 'lucide-vue-next';
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Button } from '@/components/ui/button'
  import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
  } from '@/components/ui/item'

  
  type ShoppingCenter = {
          sc_name: string,
          sc_id: number,
          sc_address: string,
          sc_loading_slots: string
  }


  const shoppingCenterState = await useState<ShoppingCenter | undefined>('shoppingCenterState');
  let searchValue = ref("");
  const { data: shoppingCenters, error } = await useLazyFetch("/api/shopping-center");
  const itemsPerPage = ref(3);
  const total = ref(shoppingCenters.value?.length);
  const page = ref(1);

  const filteredCenters = computed(() => {
    if (searchValue.value === "") {
      return shoppingCenters.value
    }
    return shoppingCenters.value?.filter(center => 
      center.sc_name.toLowerCase().includes(searchValue.value.toLowerCase())
    )
  })
  
  function updateShoppingCenterState(shoppingCenter: ShoppingCenter) {
    shoppingCenterState.value = shoppingCenter;
  }

</script>

<template>
    <div class="w-fit text-2xl font-semibold">
      Welcome to
    </div>
    <div class="w-fit text-5xl font-semibold">
      Smart, seamless drive-thru shopping
    </div>
    <div class="w-fit text-base">
      Select a mall to start browsing stores and placing your order.
    </div>
    <InputGroup class="w-full">
      <InputGroupInput placeholder="Search..." v-model="searchValue" />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
      </InputGroupAddon>
    </InputGroup>
    <div
      v-for="shoppingCenter of filteredCenters"
      v-if="shoppingCenters != undefined && error == null"
    >
      <Item
        variant="outline"
        class="cursor-pointer"
        @click="updateShoppingCenterState(shoppingCenter)"
      >
        <ItemMedia>
          <div>
            <Avatar>
              <AvatarImage src="https://github.com/evilrabbit.png" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
          </div>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{{ shoppingCenter.sc_name }}</ItemTitle>
          <ItemDescription>{{ shoppingCenter.sc_address }}</ItemDescription>
        </ItemContent>
      </Item>
    </div>
    <div v-else-if="error != null">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BadgeAlert />
          </EmptyMedia>
          <EmptyTitle>No Shopping Center Found</EmptyTitle>
          <EmptyDescription>
            Available shopping centers will be shown here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
          <Button
      v-else-if="shoppingCenters == undefined && error == null"
      disabled
      class="w-fit"
    >
      <Spinner />
      Loading
    </Button>
    <Pagination
    v-slot="{ page }"
    v-model:items-per-page="itemsPerPage"
    v-model:total="total"
    v-model:page="page"
    >
    <PaginationContent v-slot="{ items }">
      <PaginationPrevious />
      <template
        v-for="(item, index) in items"
        :key="index"
      >
        <PaginationItem
          v-if="item.type === 'page'"
          :value="item.value"
          :is-active="item.value === page"
        >
          {{ item.value }}
        </PaginationItem>
      </template>
      <PaginationNext />
    </PaginationContent>
  </Pagination>
  <!-- <div class="mx-auto px-8 py-8 flex flex-col min-h-screen gap-4 max-w-lg">
    <div
      class="flex flex-row justify-end"
      style=""
    >
      <div class="flex flex-row gap-2">
        <Button
          class="cursor-pointer"
          @click="logOut()"
        >
          Logout
        </Button>
        <Avatar
          :key="userSessionPictureUsable"
          class="size-9"
        >
          <AvatarImage :src="userSessionPictureUsable" />
          <AvatarFallback>PIC</AvatarFallback>
        </Avatar>
      </div>
    </div>
    <div class="w-fit text-5xl font-semibold">
      Convert
    </div>
    <div>
      <Conversion
        :country-from-img="countryFromImg"
        :country-to-img="countryToImg"
        :country-from-str="countryFromStr"
        :country-to-str="countryToStr"
        :country-from-fallback="countryFromFallback"
        :country-to-fallback="countryToFallback"
      />
    </div>
    <div v-if="stateConvertFrom !== '' && stateConvertTo !== '' ">
      <Chart
        v-if="testStr !== null"
        :card-title="testStr?.finalStr ?? ''"
        :rate-delta="testStr?.rateDelta ?? 0"
        :chart-array="testStr?.finalArray ?? []"
      />
      <Button
        v-else
        disabled
      >
        <Spinner />
        Loading
      </Button>
    </div>
    <div
      v-else
      class="flex flex-col flex-1"
    >
      <RateCollection
        v-if="testStr !== null"
        :final-array="testStr?.collectionArray ?? []"
        :convert-from="convertFrom"
        :convert-to="convertTo"
      />
      <Button
        v-else
        disabled
        class="w-fit"
      >
        <Spinner />
        Loading
      </Button>
    </div>
  </div> -->
</template>