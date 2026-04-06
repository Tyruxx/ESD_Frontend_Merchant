<script lang="ts" setup>
import { 
  ChevronLeft, 
  ChevronRight, 
  PackageOpen, 
  Clock,
  Car,
  Search,
  CheckCircle2
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { cn } from '@/lib/utils'

// --- 1. TYPE DEFINITIONS ---
interface OrderItem {
  order_id: number
  item_id: number
  item_qty: number
  item_price: number
}

interface Order {
  order_id: number
  merchant_id: number
  order_status: number
  customer_plate: string
  eta: string
  order_time: string
  sc_id: number
  customer_id: number
  order_items: OrderItem[]
}

interface OrdersResponse {
  data: Order[]
}

interface ItemCatalog {
  item_id: number
  merchant_id: number
  item_name: string
  item_qty: number
  item_price: number
}

// --- 2. STATE MANAGEMENT ---
const selectedDate = ref<Date>(new Date())
const isDetailsOpen = ref(false)
const selectedOrder = ref<Order | null>(null)
const isUpdating = ref(false)
const searchQuery = ref('')
const itemCatalogMap = ref<Map<number, string>>(new Map())
let pollingInterval: any = null

const userSession = useState<string>('user_session')

const formattedDateForApi = computed(() => selectedDate.value.toISOString().split('T')[0])
const displayDate = computed(() => selectedDate.value.toLocaleDateString('en-US', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
}))

// --- 3. DATA FETCHING (REACTIVE FIX) ---
const { data: response, pending, refresh } = await useFetch<OrdersResponse>(() => {
  const mId = userSession.value || '0'
  return `https://personal-0xujcjfg.outsystemscloud.com/order/rest/order/order/${mId}?date=${formattedDateForApi.value}`
}, {
  watch: [selectedDate] // Tells Nuxt to re-fetch when selectedDate changes
})

// --- 4. DATE NAVIGATION ---
function changeDate(days: number) {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + days)
  selectedDate.value = newDate
  // refresh() is handled automatically by the useFetch 'watch' option above
}

// --- 5. AUTH & LIFECYCLE ---
onMounted(() => {
  if (import.meta.client) {
    const savedId = sessionStorage.getItem('merchant_id')
    if (savedId && !userSession.value) {
      userSession.value = savedId
    }
    
    if (!userSession.value && !savedId) {
      navigateTo('/login')
      return
    }
  }

  fetchItemCatalog()

  pollingInterval = setInterval(async () => {
    if (!isDetailsOpen.value && !isUpdating.value) {
      try {
        await refresh()
      } catch (err) {
        console.error('Polling failed:', err)
      }
    }
  }, 10000)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

// --- 6. ACTIONS ---
async function fetchItemCatalog() {
  if (!userSession.value) return
  try {
    const items = await $fetch<ItemCatalog[]>(`/api/item?merchant_id=${userSession.value}`)
    itemCatalogMap.value = new Map(items.map(i => [i.item_id, i.item_name]))
  } catch (e) {
    console.error('Catalog fetch failed', e)
  }
}

function getItemName(itemId: number): string {
  return itemCatalogMap.value.get(itemId) ?? `Item #${itemId}`
}

async function updateStatus(newStatus: number) {
  if (!selectedOrder.value || !userSession.value) return
  if ([3, 4, 5].includes(selectedOrder.value.order_status)) return

  isUpdating.value = true
  try {
    await $fetch(`https://personal-0xujcjfg.outsystemscloud.com/order/rest/order/order`, {
      method: 'PUT',
      body: {
        order_id: selectedOrder.value.order_id,
        order_status: newStatus,
        merchant_id: parseInt(userSession.value),
        sc_id: selectedOrder.value.sc_id
      }
    })
    await refresh()
    isDetailsOpen.value = false
  } finally {
    isUpdating.value = false
  }
}

// --- 7. TAB & COLOR CONFIG (TINTED BG FIX) ---
const statusGroups = [
  { id: 2, label: 'ARRIVED', color: 'emerald' },
  { id: 1, label: 'CREATED', color: 'blue'    },
  { id: 9, label: 'PENDING', color: 'amber'   },
  { id: 10, label: 'FAILED',  color: 'red'     },
  { id: 3, label: 'LATE',    color: 'slate'   },
  { id: 4, label: 'NO SHOW', color: 'rose'    },
  { id: 5, label: 'DONE',    color: 'indigo'  },
]

function getTabClass(colorName: string) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 data-[state=active]:bg-emerald-600 data-[state=active]:text-white",
    blue:    "bg-blue-50 text-blue-700 border-blue-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white",
    amber:   "bg-amber-50 text-amber-700 border-amber-100 data-[state=active]:bg-amber-500 data-[state=active]:text-white",
    red:     "bg-red-50 text-red-700 border-red-100 data-[state=active]:bg-red-600 data-[state=active]:text-white",
    slate:   "bg-slate-50 text-slate-700 border-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white",
    rose:    "bg-rose-50 text-rose-700 border-rose-100 data-[state=active]:bg-rose-500 data-[state=active]:text-white",
    indigo:  "bg-indigo-50 text-indigo-700 border-indigo-100 data-[state=active]:bg-indigo-600 data-[state=active]:text-white",
  }
  return colorMap[colorName] || ""
}

const filteredOrdersByStatus = computed(() => {
  const grouped: Record<string, Order[]> = {}
  statusGroups.forEach(s => { grouped[s.id.toString()] = [] })
  if (!response.value?.data) return grouped

  const query = searchQuery.value.trim().toLowerCase()
  response.value.data.forEach((order) => {
    const oId = order.order_id?.toString() || ""
    const plate = order.customer_plate?.toLowerCase() || ""
    if (!query || oId.includes(query) || plate.includes(query)) {
      const key = order.order_status?.toString()
      if (key && grouped[key]) grouped[key].push(order)
    }
  })
  return grouped
})

const isOrderFinalized = computed(() => [3, 4, 5].includes(selectedOrder.value?.order_status ?? 0))

function formatTime(dateStr: string | undefined) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="p-4 md:p-8 w-full max-w-4xl mx-auto space-y-4 min-h-screen bg-background">
    <div class="flex flex-col gap-4 border-b pb-4">
      <div class="flex items-center justify-between">
        <h1 class="text-4xl font-bold tracking-tight">Merchant Hub</h1>
        <Badge v-if="pending" variant="outline" class="animate-pulse border-primary text-primary">Refreshing...</Badge>
      </div>
      <div class="flex items-center justify-between bg-muted/40 p-1.5 border">
        <Button variant="ghost" size="icon" @click="changeDate(-1)" class=""><ChevronLeft class="h-4 w-4" /></Button>
        <div class="flex flex-col items-center">
          <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Orders For</span>
          <span class="text-xs font-black uppercase">{{ displayDate }}</span>
        </div>
        <Button variant="ghost" size="icon" @click="changeDate(1)" class=""><ChevronRight class="h-4 w-4" /></Button>
      </div>
    </div>

    <Tabs default-value="2" class="w-full">
      <TabsList class="flex w-full justify-start overflow-x-auto bg-transparent mb-4 no-scrollbar gap-2 h-auto p-0">
        <TabsTrigger
          v-for="status in statusGroups"
          :key="status.id"
          :value="status.id.toString()"
          :class="cn(
            'w-fit border px-3 py-2 text-[11px] font-bold transition-all shadow-sm uppercase', 
            getTabClass(status.color)
          )"
        >
          {{ status.label }}
          <Badge v-if="filteredOrdersByStatus[status.id.toString()]?.length" 
            class="ml-2 h-4 px-1.5 border-none text-[9px] bg-black/5 text-inherit">
            {{ filteredOrdersByStatus[status.id.toString()]?.length }}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <div class="relative mb-4">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search ID or Plate..." class="pl-9 h-12 bg-card border-none shadow-inner font-bold" />
      </div>

      <TabsContent v-for="status in statusGroups" :key="status.id" :value="status.id.toString()" class="space-y-3 outline-none">
        <div v-for="order in filteredOrdersByStatus[status.id.toString()]" :key="order.order_id" 
          @click="selectedOrder = order; isDetailsOpen = true"
          class="w-full border p-5 bg-card flex items-center justify-between border-l-8 border-l-primary/30 cursor-pointer transition-all hover:translate-x-1 hover:shadow-md active:scale-95">
          <div class="flex flex-col"><span class="text-[10px] font-bold text-muted-foreground uppercase">Order ID</span><span class="text-xl font-black italic">#{{ order.order_id }}</span></div>
          <div class="flex flex-col items-center"><span class="text-[10px] font-bold text-muted-foreground uppercase">ETA</span><span class="text-sm font-bold bg-muted px-2 py-1">{{ formatTime(order.eta) }}</span></div>
          <div class="flex items-center gap-3">
            <div class="text-right"><span class="text-[10px] font-bold text-muted-foreground uppercase block">Plate</span><span class="text-xs font-black uppercase text-primary">{{ order.customer_plate || 'N/A' }}</span></div>
            <div class="p-1.5 bg-muted"><ChevronRight class="h-4 w-4" /></div>
          </div>
        </div>
        
        <div v-if="filteredOrdersByStatus[status.id.toString()]?.length === 0 && !pending" class="py-24 text-center opacity-20 flex flex-col items-center">
          <PackageOpen class="h-12 w-12 mb-3" />
          <p class="text-xs font-black uppercase tracking-widest">No orders found</p>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog :open="isDetailsOpen" @update:open="isDetailsOpen = $event">
      <DialogContent class="max-w-[92vw] sm:max-w-[425px] p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader class="p-8 bg-muted/30 border-b">
          <div class="space-y-1">
            <span class="text-[10px] font-black uppercase tracking-widest text-primary">Summary</span>
            <DialogTitle class="text-3xl font-black italic uppercase">Order #{{ selectedOrder?.order_id }}</DialogTitle>
          </div>
          <DialogDescription class="grid grid-cols-2 gap-4 mt-6 text-foreground">
            <div class="bg-card p-4 border border-dashed"><span class="text-[9px] font-black uppercase text-muted-foreground block mb-1">Plate</span><span class="text-sm font-black uppercase"><Car class="inline h-3 w-3 mr-1" />{{ selectedOrder?.customer_plate || 'N/A' }}</span></div>
            <div class="bg-card p-4 border border-dashed"><span class="text-[9px] font-black uppercase text-muted-foreground block mb-1">ETA</span><span class="text-sm font-black"><Clock class="inline h-3 w-3 mr-1" />{{ formatTime(selectedOrder?.eta) }}</span></div>
          </DialogDescription>
        </DialogHeader>

        <div class="p-8 space-y-6 bg-card">
          <div class="space-y-4">
            <h3 class="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b pb-2">Order Items</h3>
            <div v-for="item in selectedOrder?.order_items" :key="item.item_id" class="flex justify-between items-center text-sm border-b border-dashed border-muted/50 pb-3">
              <div class="flex flex-col"><span class="font-black italic uppercase">{{ getItemName(item.item_id) }}</span><span class="text-[10px] text-muted-foreground font-bold uppercase">Quantity: {{ item.item_qty }}</span></div>
              <span class="font-black text-primary">${{ (item.item_price * item.item_qty).toFixed(2) }}</span>
            </div>
          </div>

          <template v-if="!isOrderFinalized">
            <div class="flex flex-col gap-3 pt-4">
              <Button class="w-full h-14 font-black uppercase tracking-widest shadow-lg shadow-primary/20" :disabled="isUpdating" @click="updateStatus(5)">Handed Over</Button>
              <Button variant="outline" class="w-full h-14 font-black uppercase tracking-widest border-2 hover:bg-destructive hover:text-white transition-all" :disabled="isUpdating" @click="updateStatus(4)">No Show</Button>
            </div>
          </template>
          <div v-else class="bg-primary/5 p-6 flex items-center justify-center gap-3 border border-primary/10">
            <CheckCircle2 class="h-6 w-6 text-primary" />
            <span class="text-xs font-black uppercase tracking-widest text-primary">Finalized: {{ statusGroups.find(s => s.id === selectedOrder?.order_status)?.label }}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>