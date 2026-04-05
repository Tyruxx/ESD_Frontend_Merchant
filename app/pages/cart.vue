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
    import { Input } from '@/components/ui/input'
    import { MinusIcon, PlusIcon, ChevronLeft } from 'lucide-vue-next'


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
        // We add these for UI display purposes only
        merchant_name?: string;
        items_full_data: Item[];
    };

    type Cart = SubmitOrderRequest[];

    const plate_number = ref("")

    const cartState = await useState<Cart | undefined>('cartState');

    function updateQuantity(type: string, merchant_id: number, item_id: number) {
        const order = cartState.value?.find(o => o.merchant_id === merchant_id);
        if (!order) return;

        const itemRef = order.item_list.find(i => i.item_id === item_id);
        const fullData = order.items_full_data.find(i => i.item_id === item_id);

        if (itemRef && fullData) {
            if (type === "minus") {
                if (itemRef.item_qty > 0) {
                    itemRef.item_qty--;
                    fullData.item_qty--;
                }
            } else {
                itemRef.item_qty++;
                fullData.item_qty++;
            }
        }
    }

    async function submitOrder(order: SubmitOrderRequest) {
        try {
            const response = await $fetch('/api/submit-order', {
                method: 'POST',
                body: {
                    merchant_id: order.merchant_id,
                    customer_plate: plate_number.value,
                    customer_id: 1,
                    payment_method: "STRIPE",
                    item_list: order.item_list, // Match the API field name
                    eta: new Date().toISOString()
                }
            })
            window.location.href = response.payment_url
        } catch (e) {
            alert('Submit Order Failed')
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
                v-for="cart of cartState"
            >
                <div class="flex flex-row gap-3">
                    <div>
                        <Avatar>
                        <AvatarImage src="https://github.com/evilrabbit.png" />
                        <AvatarFallback>SC</AvatarFallback>
                        </Avatar>
                    </div>
                    <ItemTitle class="text-base">{{ cart.merchant_name }}</ItemTitle>
                </div>
                <div class="flex flex-row w-full justify-between items-center" v-for="item of cart.items_full_data">
                    <div class="w-full">
                        <ItemTitle>{{ item.item_name}}</ItemTitle>
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
                      <div class="flex flex-row w-full items-center space-x-2">
                        <Input type="text" placeholder="Enter plate number..." />
                        <Button type="submit" @click="submitOrder(cart)">
                            Submit
                        </Button>
                    </div>
                </div>
            </Item>
  </div>
</template>