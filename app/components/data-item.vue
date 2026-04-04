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
    };
    type Cart = Record<string,Item[]>;

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

        // Ensure cartState is initialized
        if (!cartState.value) {
            cartState.value = {};
        }

        const merchantId = item.merchant_id.toString();
        
        // Initialize merchant array if it doesn't exist
        if (!cartState.value[merchantId]) {
            cartState.value[merchantId] = [];
        }

        // Check if THIS specific item is already in the cart for this merchant
        const existingItem = cartState.value[merchantId].find(i => i.item_id === item.item_id);

        if (existingItem) {
            // BUG FIX: Update quantity instead of doing nothing
            existingItem.item_qty = quantity.value;
        } else {
            // Add new item to the start of the list
            cartState.value[merchantId].unshift({
                ...item,
                item_qty: quantity.value
            });
        }
    }
    onMounted(() => {
    const merchantId = itemState.value?.merchant_id.toString();
    if (merchantId && cartState.value?.[merchantId]) {
        const inCart = cartState.value[merchantId].find(i => i.item_id === itemState.value?.item_id);
        if (inCart) {
            quantity.value = inCart.item_qty;
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