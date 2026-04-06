<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { HTMLAttributes } from "vue"
import { GalleryVerticalEnd, Info } from "lucide-vue-next" // Added Info icon
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const merchantId = ref('')
const password = ref('')

const userSession = useState<string>('user_session', () => '')

// --- 1. PERSISTENCE LOGIC ---
watch(userSession, (newVal) => {
  if (import.meta.client) {
    if (newVal) {
      sessionStorage.setItem('merchant_id', newVal)
    } else {
      sessionStorage.removeItem('merchant_id')
    }
  }
})

onMounted(() => {
  if (import.meta.client) {
    const savedId = sessionStorage.getItem('merchant_id')
    if (savedId && !userSession.value) {
      userSession.value = savedId
    }
  }
})

// --- 2. ACTIONS ---
function setUserSession() {
  const id = merchantId.value.trim()
  const pass = password.value.trim()
  
  // Logic check: only '10' is allowed for this demo
  if (id !== '10' || pass !== '10') {
    toast.error('Invalid Merchant ID or Password', {
      description: 'Please use the demo credentials to login.'
    })
    return
  }

  if (id) {
    userSession.value = id
    navigateTo('/')
  }
}

// Helper to quickly fill the ID
function useDemo() {
  merchantId.value = '10'
  password.value = '10' // Set demo password as well
  toast.success('Demo credentials filled! Click Login to proceed.')
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <form @submit.prevent="setUserSession()">
      <FieldGroup>
        <div class="flex flex-col items-center gap-2 text-center">
          <div class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <GalleryVerticalEnd class="size-6" />
          </div>
          <h1 class="text-xl font-bold">Merchant Login</h1>
          <FieldDescription>
            Enter your ID to access the dashboard.
          </FieldDescription>
        </div>

        <Field>
          <FieldLabel for="merchantId">Merchant ID</FieldLabel>
          <Input
            id="merchantId"
            type="text" 
            placeholder="Enter ID..."
            v-model="merchantId"
            required
            class="h-11"
          />
        </Field>

        <Field>
          <FieldLabel for="customerId">Password</FieldLabel>
          <Input
            id="customerId"
            type="password" 
            placeholder="e.g. 1"
            v-model="password"
            required
            class="h-11"
          />
        </Field>

        <div 
          @click="useDemo"
          class="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors border-dashed"
        >
          <div class="bg-primary/20 p-1.5 rounded-md">
            <Info class="size-4 text-primary" />
          </div>
          <div class="flex flex-col">
            <span class="text-[11px] font-bold uppercase tracking-wider opacity-70">Demo Account</span>
            <span class="text-xs font-medium">Use Merchant ID: <span class="font-bold text-primary">10</span></span>
          </div>
        </div>

        <Field>
          <Button 
            type="submit" 
            class="w-full h-11 font-bold"
            :disabled="merchantId.trim() === ''"
          >
            Login
          </Button>
        </Field>
      </FieldGroup>
    </form>

    <FieldDescription class="px-6 text-center text-[11px]">
      By clicking continue, you agree to our <a href="#" class="underline underline-offset-4 hover:text-primary">Terms of Service</a>
    </FieldDescription>
  </div>
</template>