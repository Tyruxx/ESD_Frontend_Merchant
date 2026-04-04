<script lang="ts" setup>
import Merchants from '~/components/merchants.vue'

  type ShoppingCenter = {
          sc_name: string,
          sc_id: number,
          sc_address: string,
          sc_loading_slots: string
  }

  type Merchant = {
      merchant_id: number,
      sc_id: number,
      merchant_name: string
  }

  type Item = {
      item_id: number,
      merchant_id: number,
      item_name: string,
      item_qty: number,
      item_price: number,
      is_on_sale: boolean
  }
  type Cart = Record<string,Item>;

  const shoppingCenterState = await useState<ShoppingCenter | undefined>('shoppingCenterState', undefined);
  const merchantState = await useState<Merchant | undefined>('merchantState', undefined);
  const itemState = await useState<Item | undefined>('itemState', undefined);
  const cartState = await useState<Cart | undefined>('cartState', undefined);
</script>
<template>
  <div class="px-8 py-8 flex mx-auto flex-col min-h-screen gap-4 w-sm">
    <ShoppingCenters v-if="shoppingCenterState == undefined && merchantState == undefined && itemState == undefined" />
    <Merchants v-if="shoppingCenterState != undefined && merchantState == undefined && itemState == undefined" />
    <Items v-if="shoppingCenterState != undefined && merchantState != undefined && itemState == undefined" />
    <DataItem v-if="shoppingCenterState != undefined && merchantState != undefined && itemState != undefined" />
  </div>
</template>
