<script lang="ts" setup>
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Clock, Package } from 'lucide-vue-next'
import {
  Item,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'

// Status Mapping based on your requirements
const statusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  1: { label: 'CREATED (PAYMENT SUCCESSFUL)', variant: 'default' },
  2: { label: 'ARRIVED', variant: 'secondary' },
  3: { label: 'ARRIVED OUTSIDE OPERATION TIME', variant: 'outline' },
  4: { label: 'NO SHOW', variant: 'destructive' },
  5: { label: 'HANDED OVER', variant: 'default' },
  9: { label: 'PENDING PAYMENT', variant: 'outline' },
  10: { label: 'PAYMENT FAILED', variant: 'destructive' },
}

// Mock Data
const { data: orders, error } = await useLazyFetch(`/api/order-by-customer-id?customer_id=1`)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString([], { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  })
}

function calculateTotal(items: any[]) {
  return items.reduce((acc, item) => acc + (item.item_qty * item.item_price), 0)
}

function goToHome() {
  navigateTo('/')
}
</script>

<template>
  <div class="px-8 py-8 flex mx-auto flex-col min-h-screen gap-6 w-full max-w-md">
    <div class="flex flex-col gap-4">
      <Button size="icon" @click="goToHome">
        <ChevronLeft class="w-4 h-4" />
      </Button>
      <div>
        <h1 class="text-3xl font-semibold">My Orders</h1>
        <p class="text-muted-foreground text-sm">Track your recent orders and status.</p>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <Item
        v-for="order in orders?.data"
        :key="order.order_id"
        variant="outline"
        class="flex flex-col items-start p-4 gap-4"
      >
        <div class="flex justify-between w-full items-start">
          <div class="flex flex-col">
            <ItemTitle class="text-lg">Order #{{ order.order_id }}</ItemTitle>
            <ItemDescription>Plate: {{ order.customer_plate }}</ItemDescription>
          </div>
          <Badge :variant="statusMap[order.order_status]?.variant || 'outline'" v-if="order.order_status != undefined">
            {{ statusMap[order.order_status]?.label }}
          </Badge>
          <Badge variant="outline" v-else>
            UNKNOWN
          </Badge>
        </div>

        <Separator />

        <div class="w-full space-y-2">
          <div 
            v-for="item in order.order_items" 
            :key="item.item_id"
            class="flex justify-between text-sm"
          >
            <span class="flex gap-2">
              <span class="font-bold text-primary">{{ item.item_qty }}x</span>
              Item #{{ item.item_id}}
            </span>
            <span class="font-medium">${{ (item.item_price * item.item_qty).toFixed(2) }}</span>
          </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-3 w-full">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock class="w-3 h-3" />
            <span>ETA: {{ formatDate(order.eta ?? "") }}</span>
          </div>
          
          <div class="flex justify-between items-center w-full">
             <div class="text-xs text-muted-foreground">
               Ordered: {{ formatDate(order.eta ?? "") }}
             </div>
             <div class="text-lg font-bold">
               Total: ${{ calculateTotal(order.order_items ?? []).toFixed(2) }}
             </div>
          </div>
        </div>
      </Item>
    </div>

    <div v-if="orders?.data.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
      <Package class="w-12 h-12 text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium">No orders yet</h3>
      <p class="text-sm text-muted-foreground">When you place an order, it will appear here.</p>
      <Button class="mt-4" @click="goToHome">Start Shopping</Button>
    </div>
  </div>
</template>