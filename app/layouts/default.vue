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
import { GalleryVerticalEnd } from 'lucide-vue-next';
import { computed, watch, onMounted } from 'vue'

// --- 1. SESSION STATE ---
const userSession = useState<string>('user_session', () => '')

// --- 2. PERSISTENCE & HYDRATION ---
// On mount, check if a merchant ID is already saved in the browser
onMounted(() => {
  if (import.meta.client) {
    const savedCart = sessionStorage.getItem('user_cart');
    const savedSession = sessionStorage.getItem('merchant_id')
    if (savedSession && !userSession.value) {
      userSession.value = savedSession
    }
  }
})

// Watch for changes (like logging out) to update storage
watch(userSession, (value) => {
  if (import.meta.client) {
    if (!value) {
      sessionStorage.removeItem('merchant_id')
    } else {
      sessionStorage.setItem('merchant_id', value)
    }
  }
})

// --- 3. COMPUTED & ACTIONS ---
const merchantId = computed(() => userSession.value)

function logout() {
  userSession.value = ''
  // Clear storage immediately to be safe
  if (import.meta.client) {
    sessionStorage.removeItem('merchant_id')
  }
  navigateTo('/login')
}
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
                <span class="truncate font-semibold">PickNGo</span>
                <span class="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton as-child>
                  <NuxtLink to="/">
                    <span>Home</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter class="items-start p-4 flex flex-row gap-4" v-if="merchantId != ''">
        <div class="text-sm mb-2">Logged in as Merchant ID {{ merchantId }}</div>
        <Button @click="logout()" class="">Logout</Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <header class="sticky top-0 z-20 bg-background flex px-3 py-5 h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div class="flex flex-row flex-1 items-center gap-2 px-4 justify-between">
          <SidebarTrigger class="-ml-1 h-5 w-5" />
        </div>
      </header>
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>