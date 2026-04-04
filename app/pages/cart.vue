<script lang="ts" setup>
    import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    } from '@/components/ui/card'
    import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
    } from '@/components/ui/item'
    import { MinusIcon, PlusIcon, ChevronLeft } from 'lucide-vue-next'


    type Item = {
      item_id: number,
      merchant_id: number,
      item_name: string,
      item_qty: number,
      item_price: number,
      is_on_sale: boolean
    }

    type Cart = Record<string,Item[]>;
    const cartState = await useState<Cart | undefined>('cartState');
    function updateQuantity(type: string, merchant_id: number, item_id: number) {
        const mId = merchant_id.toString();
        const merchantItems = cartState.value?.[mId];
        
        if (!merchantItems) return;

        const item = merchantItems.find(i => i.item_id === item_id);
        
        if (item) {
            if (type === "minus") {
                if (item.item_qty > 0) item.item_qty--;
            } else {
                // Note: You might want to check against a 'stock' limit here if available
                item.item_qty++;
            }
    }
}
    function goToHome() {
        navigateTo('/');
    }

</script>
<template>
  <div class="px-8 py-8 flex mx-auto flex-col min-h-screen gap-4 w-sm">
        <div>
            <Button @click="goToHome()">
                <ChevronLeft />
            </Button>
        </div>
        <div class="w-fit text-5xl font-semibold">
            Cart
        </div>
        <div class="w-fit text-base">
            Review your items before submitting.
        </div>
            <Item
                variant="outline"
                class="cursor-pointer flex flex-col items-start"
                v-for="(cart, merchant_id) of cartState"
            >
                <div class="flex flex-row gap-3">
                    <div>
                        <Avatar>
                        <AvatarImage src="https://github.com/evilrabbit.png" />
                        <AvatarFallback>SC</AvatarFallback>
                        </Avatar>
                    </div>
                    <ItemTitle class="text-base">{{ merchant_id }}</ItemTitle>
                </div>
                <div class="flex flex-row w-full justify-between items-center" v-for="item of cart">
                    <div class="w-full">
                        <ItemTitle>{{ item.item_name }}</ItemTitle>
                        <ItemDescription>${{ item.item_price }} each</ItemDescription>
                    </div>
                    <div class="font-semibold flex flex-col items-end gap-1">
                        <div>${{ item.item_qty * item.item_price }}</div>
                        <ButtonGroup class="flex flex-row">
                            <Button variant="outline" @click="updateQuantity(`minus`, item.merchant_id, item.item_id)"><MinusIcon /></Button>
                            <Button disabled variant="outline">{{ item.item_qty }}</Button>
                            <Button variant="outline" @click="updateQuantity(`plus`, item.merchant_id, item.item_id)"><PlusIcon /></Button>
                        </ButtonGroup>
                    </div>
                </div>
                <div class="flex flex-row w-full justify-between items-center">
                    <div class="w-full">
                        <ItemDescription></ItemDescription>
                        <ItemTitle class="text-base"></ItemTitle>
                    </div>
                    <div class="font-semibold flex flex-col items-end gap-1">
                        <Button>Submit Order</Button>
                    </div>
                </div>
            </Item>
  </div>
</template>