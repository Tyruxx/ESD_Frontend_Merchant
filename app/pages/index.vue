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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

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

// --- 2. STATE MANAGEMENT ---
const selectedDate = ref<Date>(new Date()) 
const isDetailsOpen = ref(false)
const selectedOrder = ref<Order | null>(null)
const isUpdating = ref(false)
const isDebugEnabled = ref(false)
const searchQuery = ref('')
let pollingInterval: any = null

const formattedDateForApi = computed(() => selectedDate.value.toISOString().split('T')[0])
const displayDate = computed(() => selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
}))

// --- 3. DATA FETCHING ---
const { data: response, pending, error, refresh } = await useFetch<OrdersResponse>(() => 
  `https://personal-0xujcjfg.outsystemscloud.com/order/rest/order/order/10?date=${formattedDateForApi.value}`
)

// --- 4. SMART POLLING LOGIC ---
onMounted(() => {
  // Check for updates every 10 seconds
  pollingInterval = setInterval(async () => {
    // Only refresh if the user isn't busy in a dialog or performing an update
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
function openDetails(order: Order) {
  selectedOrder.value = order
  isDetailsOpen.value = true
}

async function updateStatus(newStatus: number) {
  if (!selectedOrder.value) return
  isUpdating.value = true
  try {
    await $fetch(`https://personal-0xujcjfg.outsystemscloud.com/order/rest/order/order`, {
      method: 'PUT',
      body: {
        order_id: selectedOrder.value.order_id,
        order_status: newStatus,
        merchant_id: selectedOrder.value.merchant_id,
        sc_id: selectedOrder.value.sc_id
      }
    })
    // Manual refresh after action
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
  { id: 9, label: 'PENDING PAYMENT', desc: 'Orders awaiting payment confirmation from the customer.' },
  { id: 10, label: 'PAYMENT FAILED', desc: 'Orders where the payment transaction was unsuccessful.' },
  { id: 1, label: 'CREATED', desc: 'Orders that have been newly created and are pending processing.' },
  { id: 2, label: 'ARRIVED', desc: 'Orders for customers who have arrived within the merchant\'s operating hours.' },
  { id: 3, label: 'ARRIVED OUTSIDE', desc: 'Orders for customers who have arrived outside the merchant\'s operating hours.' },
  { id: 4, label: 'NO SHOW', desc: 'Orders where the staff could not locate the customer\'s vehicle.' },
  { id: 5, label: 'HANDED OVER', desc: 'Orders that have been successfully delivered to the customer.' },
]

const filteredOrdersByStatus = computed(() => {
  const grouped: Record<string, Order[]> = {}
  statusGroups.forEach(s => { grouped[s.id.toString()] = [] })
  if (!response.value?.data) return grouped

  const query = searchQuery.value.trim().toLowerCase()

  response.value.data.forEach((order) => {
    const matchesSearch = !query || 
      order.order_id.toString().includes(query) ||
      ('#' + order.order_id.toString()).includes(query) ||
      order.customer_plate?.toLowerCase().includes(query)

    if (matchesSearch) {
      const statusKey = order.order_status.toString()
      if (!grouped[statusKey]) grouped[statusKey] = []
      grouped[statusKey]?.push(order)
    }
  })

  // Sort each group by ETA descending
  statusGroups.forEach(s => {
    const key = s.id.toString()
    grouped[key] = grouped[key]!.slice().sort((a, b) => new Date(b.eta).getTime() - new Date(a.eta).getTime())
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
  <div class="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-4 min-h-screen bg-background text-foreground font-sans">
    
    <div class="flex flex-col gap-4 border-b pb-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl md:text-3xl font-bold  ">
          Merchant Dashboard
        </h1>
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
      <Tabs default-value="9" class="w-full" @update:model-value="searchQuery = ''">
        <TabsList class="flex w-full justify-start overflow-x-auto bg-transparent mb-4 pb-1 no-scrollbar gap-2 h-auto">
          <TabsTrigger 
            v-for="status in statusGroups" 
            :key="status.id" 
            :value="status.id.toString()"
            class="flex-1 min-w-[140px] border bg-muted px-3 py-2 text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-white whitespace-normal text-center leading-tight h-10 rounded-md shadow-sm"
          >
            {{ status.label }}
            <Badge v-if="filteredOrdersByStatus[status.id.toString()]?.length" class="ml-1 text-[9px] h-4 px-1" variant="secondary">
              {{ filteredOrdersByStatus[status.id.toString()]?.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent v-for="status in statusGroups" :key="status.id" :value="status.id.toString()" class="space-y-4 outline-none">
          
          <div class="bg-muted/40 p-3 rounded-lg border border-dashed">
            <p class="text-[11px] leading-relaxed text-muted-foreground font-medium ">
              {{ status.desc }}
            </p>
          </div>

          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              v-model="searchQuery" 
              placeholder="Search Order ID or Plate..." 
              class="pl-9 pr-9 h-11 rounded-xl bg-card border-2 focus-visible:ring-primary shadow-sm"
            />
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''" 
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
            >
              <X class="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div class="space-y-2">
            <div 
              v-for="order in filteredOrdersByStatus[status.id.toString()]" 
              :key="order.order_id" 
              class="w-full border rounded-xl p-4 bg-card flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform cursor-pointer border-l-4 border-l-primary"
              @click="openDetails(order)"
            >
              <div class="flex flex-col gap-0.5 min-w-[80px]">
                <span class="text-[10px] font-bold text-muted-foreground ">ID</span>
                <span class="text-lg font-bold">#{{ order.order_id }}</span>
              </div>

              <div class="flex flex-col gap-0.5 px-2">
                <span class="text-[10px] font-bold text-muted-foreground ">ETA</span>
                <span class="text-sm font-semibold whitespace-nowrap">{{ formatTime(order.eta) }}</span>
              </div>

              <div class="hidden sm:flex flex-col gap-0.5 px-2">
                <span class="text-[10px] font-bold text-muted-foreground ">Plate</span>
                <span class="text-sm font-semibold whitespace-nowrap">{{ order.customer_plate || "N/A" }}</span>
              </div>
              
              <div class="flex items-center gap-2 ml-auto">
                <Badge 
                  v-if="status.id === 1 && isUrgent(order.eta)" 
                  variant="destructive" 
                  class="animate-pulse flex items-center gap-1 text-[9px] px-2 h-6"
                >
                  <AlertCircle class="h-3 w-3" /> <span class="hidden xs:inline ">Soon</span>
                </Badge>

                <div class="flex flex-col items-end mr-1 xs:flex hidden">
                  <span class="text-[10px] font-bold text-muted-foreground ">Plate</span>
                  <span class="text-xs font-bold">{{ order.customer_plate }}</span>
                </div>
                <ChevronRight class="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </div>

            <div v-if="filteredOrdersByStatus[status.id.toString()]?.length === 0" class="flex flex-col items-center justify-center py-12 opacity-40">
              <PackageOpen class="h-10 w-10 mb-2" />
              <p class="text-xs font-bold">{{ searchQuery ? 'No matching results' : 'No orders found' }}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <Dialog :open="isDetailsOpen" @update:open="isDetailsOpen = $event">
      <DialogContent class="max-w-[92vw] sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader class="p-6 bg-muted/30 text-left border-b">
          <div class="flex justify-between items-start">
            <DialogTitle class="text-2xl font-bold">
              Order #{{ selectedOrder?.order_id }}
            </DialogTitle>
            <Badge v-if="selectedOrder?.order_status === 1 && isUrgent(selectedOrder?.eta)" variant="destructive" class="animate-pulse">
              Soon
            </Badge>
          </div>
          <DialogDescription class="grid grid-cols-2 gap-4 mt-4 text-foreground">
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-muted-foreground">Plate Number</span>
              <span class="text-sm font-bold text-primary flex items-center gap-1 mt-1">
                <Car class="h-3 w-3" /> {{ selectedOrder?.customer_plate || 'N/A' }}
              </span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-muted-foreground">Customer ETA</span>
              <span class="text-sm font-bold flex items-center gap-1 mt-1">
                <Clock class="h-3 w-3" /> {{ formatTime(selectedOrder?.eta) }}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div class="p-6 space-y-6">
          <div class="space-y-4">
            <h3 class="text-[10px] font-bold text-muted-foreground border-b pb-1">Items Summary</h3>
            <div v-if="selectedOrder?.order_items?.length" class="max-h-[30vh] overflow-y-auto pr-2 space-y-4">
              <div v-for="item in selectedOrder.order_items" :key="item.item_id" class="flex justify-between items-center text-sm border-b border-dashed pb-3">
                <div class="flex flex-col">
                  <span class="font-bold">Item ID: {{ item.item_id }}</span>
                  <span class="text-xs text-muted-foreground font-medium">Qty: {{ item.item_qty }}</span>
                </div>
                <span class="font-bold text-lg">${{ (item.item_price * item.item_qty).toFixed(2) }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground text-center py-8 ">No items listed.</p>
          </div>

          <Separator />

          <div class="flex flex-col gap-3">
            <Button class="w-full h-12 font-bold" :disabled="isUpdating" @click="updateStatus(5)">
              Handed Over
            </Button>
            <Button variant="destructive" class="w-full h-12 font-bold" :disabled="isUpdating" @click="updateStatus(4)">
              No Show
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

[data-radix-collection-item] {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>