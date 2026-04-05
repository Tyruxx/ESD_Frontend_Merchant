<script lang="ts" setup>
    import { AspectRatio } from '@/components/ui/aspect-ratio'
    import { MinusIcon, PlusIcon, ChevronLeft } from 'lucide-vue-next'
    import { Button } from '@/components/ui/button'
    import { ButtonGroup } from '@/components/ui/button-group'
    

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
        customer_id: string;
        payment_method: string;
        item_list: OrderItem[];
        eta: string;
        // We add these for UI display purposes only
        merchant_name?: string;
        items_full_data: Item[];
        sc_id: number
    };

    type Cart = SubmitOrderRequest[];

    type ShoppingCenter = {
            sc_name: string,
            sc_id: number,
            sc_address: string,
            sc_loading_slots: string
    }

    const shoppingCenterState = await useState<ShoppingCenter | undefined>('shoppingCenterState');
    const itemState = await useState<Item | undefined >('itemState');
    const cartState = await useState<Cart | undefined>('cartState');
    const quantity = ref(0);
    function updateQuantity(type: string) {
        if (type == "minus") {
            if (quantity.value > 0) {
                quantity.value--;
            }
        } else {
            if (quantity.value < (itemState.value?.item_qty ?? 0)) {
                quantity.value++;
            }
        }
    }
    function revertItemState() {
        itemState.value = undefined;
    }

function updateIntoCart() {
    const item = itemState.value;
    if (!item) return;

    if (!cartState.value) cartState.value = [];

    // Find the order for this specific merchant
    let merchantOrder = cartState.value.find(order => order.merchant_id === item.merchant_id);

    if (!merchantOrder) {
        // Create a new order entry for this merchant
        merchantOrder = {
            merchant_id: item.merchant_id,
            sc_id: shoppingCenterState.value?.sc_id ?? 0,
            customer_plate: "", // Default from API
            customer_id: "",    // Default from API
            payment_method: "", // Default from API
            eta: new Date().toISOString(),
            item_list: [],
            items_full_data: []
        };
        cartState.value.push(merchantOrder);
    }

    const existingItemIdx = merchantOrder.item_list.findIndex(i => i.item_id === item.item_id);

    if (quantity.value <= 0) {
        // Remove item if quantity is 0
        if (existingItemIdx > -1) {
            merchantOrder.item_list.splice(existingItemIdx, 1);
            merchantOrder.items_full_data.splice(existingItemIdx, 1);
        }
    } else {
        if (existingItemIdx > -1 && merchantOrder.item_list[existingItemIdx] != undefined && merchantOrder.items_full_data[existingItemIdx] != undefined) {
            merchantOrder.item_list[existingItemIdx].item_qty = quantity.value;
            merchantOrder.items_full_data[existingItemIdx].item_qty = quantity.value;
        } else {
            merchantOrder.item_list.unshift({ item_id: item.item_id, item_qty: quantity.value });
            merchantOrder.items_full_data.unshift({ ...item, item_qty: quantity.value });
        }
    }
}
    onMounted(() => {
        const merchantId = itemState.value?.merchant_id;
        if (merchantId != undefined && cartState.value) {
            // Find the merchant order in the array first
            const merchantOrder = cartState.value.find(o => o.merchant_id === merchantId);
            
            if (merchantOrder) {
                // Then find the specific item within that merchant's list
                const inCart = merchantOrder.item_list.find(i => i.item_id === itemState.value?.item_id);
                if (inCart) {
                    quantity.value = inCart.item_qty;
                }
            }
        }
    });
</script>
<template>
    <div>
        <Button @click="revertItemState()">
            <ChevronLeft />
        </Button>
    </div>
    <div class="flex flex-1 flex-col gap-6 max-w-lg min-w-xs">
        <AspectRatio :ratio="16 / 9" class="bg-muted rounded-lg">
            <img
                src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                alt="Photo by Drew Beamer"
                fill
                class="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
            >
        </AspectRatio>
        <div class="flex flex-col gap-2">
            <div class="w-fit text-3xl font-base">
                {{ itemState?.item_name }}
            </div>
            <div>
                There are {{ itemState?.item_qty }} pieces left.
            </div>
        </div>
        <div class="flex flex-col gap-2">
            <div class="w-fit text-5xl font-semibold">
                ${{ itemState?.item_price }}
            </div>
            <div class="flex flex-row gap-4 items-center">
                <div class="w-fit text-base font-base">Quantity</div>
                <ButtonGroup>
                    <Button variant="outline" @click="updateQuantity('minus')"><MinusIcon /></Button>
                    <Button disabled variant="outline">{{ quantity }}</Button>
                    <Button variant="outline" @click="updateQuantity('plus')"><PlusIcon /></Button>
                </ButtonGroup>
            </div>
        </div>
        <Button @click="updateIntoCart()">Add to cart  (${{ (itemState?.item_price ?? 0) * quantity }})</Button>
    </div>
</template>