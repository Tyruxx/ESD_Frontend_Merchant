<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button'
import { ShoppingBag, ShoppingCart, GalleryVerticalEnd } from 'lucide-vue-next';
function goToCartPage() {
  navigateTo('/cart');
}

type Item = {
  item_id: number,
  merchant_id: number,
  item_name: string,
  item_qty: number,
  item_price: number,
  is_on_sale: boolean
}

type OrderItem = {
  item_id: number;
  item_qty: number;
};

type SubmitOrderRequest = {
    merchant_id: number;
    customer_plate: string;
    customer_id: number;
    payment_method: string;
    item_list: OrderItem[];
    eta: string;
    merchant_name?: string;
    items_full_data: Item[];
};

type Cart = SubmitOrderRequest[];
const cartState = useState<Cart | undefined>('cartState');


const totalItems = computed(() => {
    if (cartState == undefined) {
      return 0
    }
    const finalAmount = ref(0)
    for (const merchants of Object.entries(cartState.value ?? [])) {
      for (const item of merchants[1].item_list) {
        finalAmount.value += item.item_qty
      }
    }
    return finalAmount.value
})
</script>

<template>
  <SidebarProvider>
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEnd class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Acme Inc</span>
                <span class="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton as-child>
                  <NuxtLink to="/">
                    <span>Home</span>
                  </NuxtLink>
                </SidebarMenuButton>
                <SidebarMenuButton as-child>
                  <NuxtLink to="/order">
                    <span>Order</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
    <SidebarInset>
      <header class="flex px-3 py-5 h-fit shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div class="flex items-center gap-2 px-4 justify-between">
          <SidebarTrigger class="-ml-1 h-5 w-5" />
          <Button class="flex flex-row" @click="goToCartPage()">
            <div>
              {{ totalItems }}
            </div>
            <div>
              <ShoppingBag />
            </div>
          </Button>
        </div>
      </header>
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>