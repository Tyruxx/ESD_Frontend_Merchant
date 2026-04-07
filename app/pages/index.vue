<script lang="ts" setup>
import { 
  ChevronLeft, 
  ChevronRight, 
  PackageOpen, 
  Clock,
  Car,
  Search,
  CheckCircle2,
  Info
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { cn } from '@/lib/utils'

// --- 1. STATE MANAGEMENT ---
const activeTab = ref("2") 
const selectedDate = ref<Date>(new Date())
const isDetailsOpen = ref(false)
const selectedOrder = ref<any | null>(null)
const isUpdating = ref(false)
const searchQuery = ref('')
const itemCatalogMap = ref<Map<number, string>>(new Map())
let pollingInterval: any = null

// Session handling
const merchantId = computed(() => userSession.value || '0')

// --- 2. CONFIG & DESCRIPTIONS ---
const statusGroups = [
  { id: 2, label: 'ARRIVED', color: 'emerald', desc: 'Vehicles currently at the merchant location ready for pickup.' },
  { id: 1, label: 'CREATED', color: 'blue',    desc: 'New orders placed by customers but customers have not yet arrived.' },
  { id: 9, label: 'PENDING', color: 'amber',   desc: 'Orders awaiting payment confirmation or processing.' },
  { id: 10, label: 'FAILED',  color: 'red',     desc: 'Orders that could not be processed or payment failed.' },
  { id: 3, label: 'LATE',    color: 'slate',   desc: "Vehicles that arrived outside of the merchant's operating hours." },
  { id: 4, label: 'NO SHOW', color: 'rose',    desc: 'Orders where the staff could not find the vehicles.' },
  { id: 5, label: 'DONE',    color: 'indigo',  desc: 'Successfully completed and handed over orders.' },
]

const currentStatusInfo = computed(() => statusGroups.find(s => s.id.toString() === activeTab.value))

// --- 3. DATA FETCHING (INTERNAL PROXY) ---
const formattedDateForComparison = computed(() => selectedDate.value.toISOString().split('T')[0])
const displayDate = computed(() => selectedDate.value.toLocaleDateString('en-US', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
}))

// We fetch from our internal server/api/pickup.get.ts
const { data: rawResponse, pending, refresh } = await useFetch<any>('/api/pickup', {
  query: { merchantId: merchantId },
  watch: [merchantId] 
})

// --- 4. CATALOG SYNC ---
async function fetchItemCatalog() {
  if (merchantId.value === '0') return
  try {
    const items = await $fetch<any[]>(`/api/item`, {
      params: { merchant_id: merchantId.value }
    })
    if (items && Array.isArray(items)) {
      itemCatalogMap.value = new Map(items.map(i => [i.item_id, i.item_name]))
    }
  } catch (e) {
    console.error('Catalog sync failed:', e)
  }
}

watch(rawResponse, (newVal) => {
  if (newVal) fetchItemCatalog()
}, { immediate: true })

function getItemName(itemId: number): string {
  return itemCatalogMap.value.get(itemId) || `Item #${itemId}`
}

// --- 5. ACTIONS ---
function changeDate(days: number) {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + days)
  selectedDate.value = newDate
}

async function updateStatus(newStatus: number) {
  if (!selectedOrder.value || merchantId.value === '0') return
  isUpdating.value = true
  try {
    // We send to our internal server/api/pickup.put.ts
    await $fetch('/api/pickup', {
      method: 'PUT',
      body: {
        merchant_id: parseInt(merchantId.value),
        order_id: selectedOrder.value.order_id,
        order_status: newStatus,
        sc_id: selectedOrder.value.sc_id
      }
    })
    await refresh()
    isDetailsOpen.value = false
  } catch (error) {
    console.error('Update failed:', error)
  } finally { 
    isUpdating.value = false 
  }
}

// --- 6. UI HELPERS ---
const getTabClass = (colorName: string): string => {
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

// --- 7. FILTERING LOGIC ---
const filteredOrdersByStatus = computed(() => {
  const grouped: Record<string, any[]> = {}
  statusGroups.forEach(s => { grouped[s.id.toString()] = [] })
  
  const orders = rawResponse.value?.active_pickups
  if (!orders || !Array.isArray(orders)) return grouped

  const query = searchQuery.value.trim().toLowerCase()
  const targetDate = formattedDateForComparison.value

  orders.forEach((order: any) => {
    const orderDate = order.eta?.split('T')[0] || order.order_time?.split('T')[0]
    if (orderDate !== targetDate) return

    const oId = order.order_id?.toString() || ""
    const plate = order.customer_plate?.toLowerCase() || ""
    
    if (!query || oId.includes(query) || plate.includes(query)) {
      const key = (order.order_status ?? 1).toString()
      if (grouped[key]) grouped[key].push(order)
    }
  })
  return grouped
})

const canUpdateOrder = computed(() => selectedOrder.value?.order_status === 2)

function formatTime(dateStr: string | undefined) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  pollingInterval = setInterval(() => {
    if (!isDetailsOpen.value && !isUpdating.value) refresh()
  }, 10000)
})

onUnmounted(() => clearInterval(pollingInterval))

  const userSession = useState<string>('user_session', () => {
    // This runs immediately when the state is first accessed
    if (import.meta.client) {
      return sessionStorage.getItem('customer_id') || ''
    }
    return ''
  })

  watch(userSession, (val) => {
  // If we are on the client and the session is still empty after initialization
  if (import.meta.client && !val) {
    navigateTo('/login')
  }
  }, { immediate: true })
</script>

<template>
  <div class="p-4 md:p-8 w-full max-w-4xl mx-auto space-y-4 min-h-screen bg-background">

    <div class="flex flex-col gap-4 border-b pb-4">
      <div class="flex items-center justify-between">
        <h1 class="text-4xl font-bold tracking-tight">Merchant Hub</h1>
        <Badge v-if="pending" variant="outline" class="animate-pulse border-primary text-primary text-[10px]">Syncing...</Badge>
      </div>
      
      <div class="flex items-center justify-between bg-muted/40 p-1.5 border">
        <Button variant="ghost" size="icon" @click="changeDate(-1)"><ChevronLeft class="h-4 w-4" /></Button>
        <div class="flex flex-col items-center">
          <span class="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">Schedule View</span>
          <span class="text-xs font-black uppercase">{{ displayDate }}</span>
        </div>
        <Button variant="ghost" size="icon" @click="changeDate(1)"><ChevronRight class="h-4 w-4" /></Button>
      </div>
    </div>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="flex w-full justify-start overflow-x-auto bg-transparent mb-6 no-scrollbar gap-2 h-auto p-0">
        <TabsTrigger
          v-for="status in statusGroups"
          :key="status.id"
          :value="status.id.toString()"
          :class="cn('w-fit border px-3 py-2 text-[11px] font-black transition-all shadow-sm uppercase italic', getTabClass(status.color))"
        >
          {{ status.label }}
          <Badge v-if="filteredOrdersByStatus[status.id.toString()]?.length" 
            class="ml-2 h-4 px-1.5 border-none text-[9px] bg-black/5 text-inherit">
            {{ filteredOrdersByStatus[status.id.toString()]?.length }}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <div class="mb-6 space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
        <h2 class="text-xl font-black uppercase italic text-foreground tracking-tight">{{ currentStatusInfo?.label }}</h2>
        <p class="text-xs font-medium text-muted-foreground leading-relaxed max-w-2xl">{{ currentStatusInfo?.desc }}</p>
      </div>

      <div class="relative mb-4">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Filter ID or Plate..." class="pl-9 h-12 bg-muted/20 border shadow-inner font-bold" />
      </div>

      <TabsContent v-for="status in statusGroups" :key="status.id" :value="status.id.toString()" class="space-y-3 outline-none">
        <div v-for="order in filteredOrdersByStatus[status.id.toString()]" :key="order.order_id" 
          @click="selectedOrder = order; isDetailsOpen = true"
          class="w-full border p-5 bg-card flex items-center justify-between border-l-[10px] border-l-primary/20 cursor-pointer transition-all hover:translate-x-1 hover:shadow-md active:scale-95">
          <div class="flex flex-col">
            <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Reference</span>
            <span class="text-xl font-black italic">#{{ order.order_id }}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[10px] font-bold text-muted-foreground uppercase">Expected</span>
            <span class="text-xs font-black bg-muted px-2 py-1">{{ formatTime(order.eta || order.order_time) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <span class="text-[10px] font-bold text-muted-foreground uppercase block">Vehicle</span>
              <span class="text-xs font-black uppercase text-primary">{{ order.customer_plate || 'N/A' }}</span>
            </div>
            <div class="p-1.5 bg-muted"><ChevronRight class="h-4 w-4" /></div>
          </div>
        </div>

        <div v-if="filteredOrdersByStatus[status.id.toString()]?.length === 0 && !pending" class="py-24 text-center opacity-20 flex flex-col items-center">
          <PackageOpen class="h-12 w-12 mb-3" />
          <p class="text-xs font-black uppercase tracking-widest">No activity found</p>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog :open="isDetailsOpen" @update:open="isDetailsOpen = $event">
      <DialogContent class="max-w-[92vw] sm:max-w-[425px] p-0 overflow-hidden shadow-2xl border font-sans">
        <DialogHeader class="p-8 bg-muted/30 border-b text-left">
          <div class="space-y-1">
            <span class="text-[10px] font-black uppercase tracking-widest text-primary">Live Order</span>
            <DialogTitle class="text-3xl font-black italic uppercase">Order #{{ selectedOrder?.order_id }}</DialogTitle>
          </div>
          <div class="grid grid-cols-2 gap-4 mt-6">
            <div class="bg-card p-4 border border-dashed text-center">
              <span class="text-[9px] font-black uppercase text-muted-foreground block mb-1">Plate</span>
              <span class="text-xs font-black uppercase">{{ selectedOrder?.customer_plate || 'N/A' }}</span>
            </div>
            <div class="bg-card p-4 border border-dashed text-center">
              <span class="text-[9px] font-black uppercase text-muted-foreground block mb-1">Schedule</span>
              <span class="text-xs font-black">{{ formatTime(selectedOrder?.eta || selectedOrder?.order_time) }}</span>
            </div>
          </div>
        </DialogHeader>

        <div class="p-8 space-y-6 bg-card">
          <div class="space-y-4">
            <h3 class="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b pb-2">Order Items</h3>
            <div v-if="selectedOrder?.order_items" v-for="item in selectedOrder.order_items" :key="item.item_id" class="flex justify-between items-center text-sm border-b border-dashed border-muted/50 pb-3">
              <div class="flex flex-col">
                <span class="font-black italic uppercase text-xs">{{ getItemName(item.item_id) }}</span>
                <span class="text-[8px] text-muted-foreground font-black uppercase tracking-tighter">ID: {{ item.item_id }}</span>
                <span class="text-[9px] text-muted-foreground font-bold uppercase mt-1">Quantity: {{ item.item_qty }}</span>
              </div>
              <span class="font-black text-primary text-xs">${{ (item.item_price * item.item_qty).toFixed(2) }}</span>
            </div>
          </div>

          <template v-if="canUpdateOrder">
            <div class="flex flex-col gap-3 pt-4">
              <Button class="w-full h-14 font-black uppercase tracking-widest shadow-lg" :disabled="isUpdating" @click="updateStatus(5)">Hand Over</Button>
              <Button variant="outline" class="w-full h-14 font-black uppercase tracking-widest border-2 hover:bg-rose-500 hover:text-white" :disabled="isUpdating" @click="updateStatus(4)">No Show</Button>
            </div>
          </template>
          <div v-else class="bg-muted/50 p-6 flex items-center justify-center gap-3 border border-dashed">
            <Info class="h-5 w-5 text-muted-foreground" />
            <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Current Status: {{ statusGroups.find(s => s.id === selectedOrder?.order_status)?.label || 'Processed' }}
            </span>
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