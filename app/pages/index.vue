<script lang="ts" setup>
import { 
  ChevronLeft, 
  ChevronRight, 
  PackageOpen, 
  Bug,
  Clock,
  Car,
  AlertCircle,
  Search,
  X
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
  is_on_sale: boolean
}

// --- 2. STATE MANAGEMENT ---
const selectedDate = ref<Date>(new Date())
const isDetailsOpen = ref(false)
const selectedOrder = ref<Order | null>(null)
const isUpdating = ref(false)
const isDebugEnabled = ref(false)
const searchQuery = ref('')
const itemCatalogMap = ref<Map<number, string>>(new Map())
let pollingInterval: any = null

// Use the global state defined in login-form.vue
const userSession = useState<string>('user_session')

const formattedDateForApi = computed(() => selectedDate.value.toISOString().split('T')[0])
const displayDate = computed(() => selectedDate.value.toLocaleDateString('en-US', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
}))

// --- 3. DATA FETCHING ---
// Computed URL ensures reactivity if merchantId or date changes
const { data: response, pending, error, refresh } = await useFetch<OrdersResponse>(() => {
  const mId = userSession.value || '0'
  return `https://personal-0xujcjfg.outsystemscloud.com/order/rest/order/order/${mId}?date=${formattedDateForApi.value}`
})

// --- 4. LIFECYCLE & AUTH CHECK ---
onMounted(() => {
  // REDIRECT IF NOT LOGGED IN
  if (!userSession.value) {
    if (import.meta.client) {
      // Check sessionStorage one last time before booting
      const savedId = sessionStorage.getItem('merchant_id')
      if (savedId) {
        userSession.value = savedId
      } else {
        navigateTo('/login')
        return
      }
    }
  }

  fetchItemCatalog()

  // Check for updates every 10 seconds
  pollingInterval = setInterval(async () => {
    if (!isDetailsOpen.value && !isUpdating.value) {
      try {
        await refresh()
      } catch (err) {
        console.error('Polling refresh failed:', err)
      }
    }
  }, 10000)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

// --- 5. ACTIONS ---
async function fetchItemCatalog() {
  if (!userSession.value) return
  try {
    // Dynamic merchant_id based on session
    const items = await $fetch<ItemCatalog[]>(`/api/item?merchant_id=${userSession.value}`)
    itemCatalogMap.value = new Map(items.map(i => [i.item_id, i.item_name]))
  } catch (e) {
    console.error('Failed to fetch item catalog', e)
  }
}

function getItemName(itemId: number): string {
  return itemCatalogMap.value.get(itemId) ?? `Item #${itemId}`
}

function openDetails(order: Order) {
  selectedOrder.value = order
  isDetailsOpen.value = true
}

async function updateStatus(newStatus: number) {
  if (!selectedOrder.value || !userSession.value) return
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
  } catch (e) {
    console.error("Status update failed", e)
  } finally {
    isUpdating.value = false
  }
}

function changeDate(days: number) {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + days)
  selectedDate.value = newDate
  searchQuery.value = ''
}

// --- 6. TAB CONFIG & FILTERING LOGIC ---
const statusGroups = [
  { id: 2,  label: 'ARRIVED',          desc: 'Customers who arrived during operating hours.' },
  { id: 1,  label: 'CREATED',          desc: 'New orders pending processing.' },
  { id: 9,  label: 'PENDING PAYMENT',  desc: 'Orders awaiting payment confirmation.' },
  { id: 10, label: 'PAYMENT FAILED',   desc: 'Orders where payment was unsuccessful.' },
  { id: 3,  label: 'ARRIVED LATE',     desc: 'Customers who arrived outside operating hours.' },
  { id: 4,  label: 'NO SHOW',          desc: 'Staff could not locate the vehicle.' },
  { id: 5,  label: 'HANDED OVER',      desc: 'Orders successfully delivered.' },
];

const filteredOrdersByStatus = computed(() => {
  const grouped: Record<string, Order[]> = {}
  statusGroups.forEach(s => { grouped[s.id.toString()] = [] })
  
  if (!response.value?.data) return grouped

  const query = searchQuery.value.trim().toLowerCase()

  response.value.data.forEach((order) => {
    // Safety check for ID and Plate to prevent .toString() crashes
    const oId = order.order_id?.toString() || ""
    const plate = order.customer_plate?.toLowerCase() || ""

    const matchesSearch = !query ||
      oId.includes(query) ||
      ('#' + oId).includes(query) ||
      plate.includes(query)

    if (matchesSearch) {
      const statusKey = order.order_status?.toString()
      if (statusKey && grouped[statusKey]) {
        grouped[statusKey].push(order)
      }
    }
  })

  // Sort by ETA descending
  statusGroups.forEach(s => {
    const key = s.id.toString()
    grouped[key]?.sort((a, b) => new Date(b.eta).getTime() - new Date(a.eta).getTime())
  })

  return grouped
})

// --- 7. UTILS ---
function formatTime(dateStr: string | undefined) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isUrgent(etaStr: string | undefined): boolean {
  if (!etaStr) return false
  const now = new Date()
  const eta = new Date(etaStr)
  const diffInMinutes = (eta.getTime() - now.getTime()) / (1000 * 60)
  return diffInMinutes > 0 && diffInMinutes <= 30
}
</script>

<template>
  <div class="p-4 md:p-8 w-full max-w-4xl mx-auto space-y-4 min-h-screen bg-background text-foreground font-sans">
    
    <div class="flex flex-col gap-4 border-b pb-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl md:text-3xl font-bold">Merchant Dashboard</h1>
        <div class="flex items-center gap-2">
          <Badge v-if="pending" variant="outline" class="animate-pulse text-[10px]">Syncing...</Badge>
          <Button variant="ghost" size="sm" class="text-xs" @click="isDebugEnabled = !isDebugEnabled">
            <Bug class="h-4 w-4 mr-2" /> Debug
          </Button>
        </div>
      </div>

      <div class="flex items-center justify-between bg-muted p-1 rounded-lg border w-full">
        <Button variant="ghost" size="icon" @click="changeDate(-1)"><ChevronLeft class="h-4 w-4" /></Button>
        <div class="px-2 text-xs font-bold">{{ displayDate }}</div>
        <Button variant="ghost" size="icon" @click="changeDate(1)"><ChevronRight class="h-4 w-4" /></Button>
      </div>
    </div>

    <div v-if="!pending || response" class="w-full">
      <Tabs default-value="2" class="w-full" @update:model-value="searchQuery = ''">
        <TabsList class="flex w-full justify-start overflow-x-auto bg-transparent mb-4 pb-1 no-scrollbar gap-2 h-auto">
          <TabsTrigger
            v-for="status in statusGroups"
            :key="status.id"
            :value="status.id.toString()"
            class="w-fit border bg-muted px-3 py-2 text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-white whitespace-nowrap h-10 rounded-md shadow-sm"
          >
            {{ status.label }}
            <Badge v-if="filteredOrdersByStatus[status.id.toString()]?.length" class="ml-1 text-[9px] h-4 px-1" variant="secondary">
              {{ filteredOrdersByStatus[status.id.toString()]?.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent v-for="status in statusGroups" :key="status.id" :value="status.id.toString()" class="space-y-4 outline-none">
          <div class="bg-muted/40 p-3 rounded-lg border border-dashed text-[11px] text-muted-foreground">
            {{ status.desc }}
          </div>

          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input v-model="searchQuery" placeholder="Search Order ID or Plate..." class="pl-9 h-11 rounded-xl bg-card" />
            <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full">
              <X class="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="order in filteredOrdersByStatus[status.id.toString()]"
              :key="order.order_id"
              class="w-full border rounded-xl p-4 bg-card flex items-center justify-between border-l-4 border-l-primary cursor-pointer active:scale-95 transition-transform"
              @click="openDetails(order)"
            >
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] font-bold text-muted-foreground uppercase">ID</span>
                <span class="text-lg font-bold">#{{ order.order_id }}</span>
              </div>
              <div class="flex flex-col gap-0.5 px-2">
                <span class="text-[10px] font-bold text-muted-foreground uppercase">ETA</span>
                <span class="text-sm font-semibold">{{ formatTime(order.eta) }}</span>
              </div>
              <div class="flex items-center gap-2 ml-auto">
                <div class="flex flex-col items-end mr-1 text-right">
                  <span class="text-[10px] font-bold text-muted-foreground uppercase">Plate</span>
                  <span class="text-xs font-bold uppercase">{{ order.customer_plate || 'N/A' }}</span>
                </div>
                <ChevronRight class="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <Dialog :open="isDetailsOpen" @update:open="isDetailsOpen = $event">
      <DialogContent class="max-w-[92vw] sm:max-w-[425px] rounded-2xl p-0 overflow-hidden">
        <DialogHeader class="p-6 bg-muted/30 border-b">
          <DialogTitle class="text-2xl font-bold">Order #{{ selectedOrder?.order_id }}</DialogTitle>
          <DialogDescription class="grid grid-cols-2 gap-4 mt-4 text-foreground">
             <div class="flex flex-col">
              <span class="text-[10px] font-bold text-muted-foreground">Plate</span>
              <span class="text-sm font-bold uppercase"><Car class="inline h-3 w-3 mr-1" />{{ selectedOrder?.customer_plate || 'N/A' }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-muted-foreground">ETA</span>
              <span class="text-sm font-bold"><Clock class="inline h-3 w-3 mr-1" />{{ formatTime(selectedOrder?.eta) }}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div class="p-6 space-y-6">
          <div class="space-y-4">
            <h3 class="text-[10px] font-bold text-muted-foreground border-b pb-1 uppercase tracking-widest">Items</h3>
            <div v-if="selectedOrder?.order_items?.length" class="max-h-[30vh] overflow-y-auto space-y-3">
              <div v-for="item in selectedOrder.order_items" :key="item.item_id" class="flex justify-between items-center text-sm">
                <div class="flex flex-col">
                  <span class="font-bold">{{ getItemName(item.item_id) }}</span>
                  <span class="text-xs text-muted-foreground">Qty: {{ item.item_qty }}</span>
                </div>
                <span class="font-bold">${{ (item.item_price * item.item_qty).toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <Separator />
          <div class="flex flex-col gap-3">
            <Button class="w-full h-12 font-bold" :disabled="isUpdating" @click="updateStatus(5)">Handed Over</Button>
            <Button variant="destructive" class="w-full h-12 font-bold" :disabled="isUpdating" @click="updateStatus(4)">No Show</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>