<script lang="ts" setup>
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
  } from '@/components/ui/input-group';
  import { SearchIcon, ChevronLeft, BadgeAlert } from 'lucide-vue-next';
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Button } from '@/components/ui/button'
  import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
  } from '@/components/ui/item'
  import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

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

  const shoppingCenterState = await useState<ShoppingCenter | undefined>('shoppingCenterState');
  const merchantState = await useState<Merchant | undefined>('merchantState');
  let searchValue = ref("");
  const { data: merchants, error } = await useLazyFetch(`/api/merchant?sc_id=${shoppingCenterState.value?.sc_id}`);
  const itemsPerPage = ref(3);
  const total = ref(merchants.value?.length);
  const page = ref(1);

  const filteredCenters = computed(() => {
    if (searchValue.value === "") {
      return merchants.value
    }
    return merchants.value?.filter(center => 
      center.merchant_name.toLowerCase().includes(searchValue.value.toLowerCase())
    )
  })
  
  function updatemerchantState(merchant: Merchant) {
    merchantState.value = merchant;
  }

  function revertShoppingCenterState() {
    shoppingCenterState.value = undefined;
  }

</script>

<template>
    <div>
        <Button @click="revertShoppingCenterState()">
            <ChevronLeft />
        </Button>
    </div>
    <div class="w-fit text-5xl font-base">
        Available merchants at {{ shoppingCenterState?.sc_name }}
    </div>
    <div class="w-fit text-base">
        Select a merchant to start browsing items and placing your order.
    </div>
    <InputGroup class="w-full">
        <InputGroupInput placeholder="Search..." v-model="searchValue" />
        <InputGroupAddon>
        <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
        </InputGroupAddon>
    </InputGroup>
    <div
        v-for="merchant of filteredCenters"
        v-if="merchants != undefined && error == null"
    >
        <Item
        variant="outline"
        class="cursor-pointer"
        @click="updatemerchantState(merchant)"
        >
        <ItemMedia>
            <div>
            <Avatar>
                <AvatarImage src="https://github.com/evilrabbit.png" />
                <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            </div>
        </ItemMedia>
        <ItemContent>
            <ItemTitle>{{ merchant.merchant_name }}</ItemTitle>
        </ItemContent>
        </Item>
    </div>
    <div v-else-if="error != null">
        <Empty>
        <EmptyHeader>
            <EmptyMedia variant="icon">
            <BadgeAlert />
            </EmptyMedia>
            <EmptyTitle>No Merchant Found</EmptyTitle>
            <EmptyDescription>
            Available merchants will be shown here.
            </EmptyDescription>
        </EmptyHeader>
        </Empty>
    </div>
        <Button
        v-else-if="merchants == undefined && error == null"
        disabled
        class="w-fit"
        >
        <Spinner />
        Loading
        </Button>

    <Pagination
    v-slot="{ page }"
    v-model:items-per-page="itemsPerPage"
    v-model:total="total"
    v-model:page="page"
    >
        <PaginationContent v-slot="{ items }">
            <PaginationPrevious />
            <template
            v-for="(item, index) in items"
            :key="index"
            >
            <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
            >
                {{ item.value }}
            </PaginationItem>
            </template>
            <PaginationNext />
        </PaginationContent>
    </Pagination>
</template>