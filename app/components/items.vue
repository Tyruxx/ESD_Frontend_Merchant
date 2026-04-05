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

  const merchantState = await useState<Merchant | undefined>('merchantState');
  const itemState = await useState<Item | undefined >('itemState');
  let searchValue = ref("");
  const { data: items, error } = await useLazyFetch(`/api/item?merchant_id=${merchantState.value?.merchant_id}`);
  const itemsPerPage = ref(3);
  const total = ref(items.value?.length);
  const page = ref(1);

  const filteredCenters = computed(() => {
    if (searchValue.value === "") {
      return items.value
    }
    return items.value?.filter(center => 
      center.item_name.toLowerCase().includes(searchValue.value.toLowerCase())
    )
  })
  
  function updateitemState(item: Item) {
    itemState.value = item;
  }

  function revertMerchantState() {
    merchantState.value = undefined;
  }

</script>

<template>
    <div>
        <Button @click="revertMerchantState()">
            <ChevronLeft />
        </Button>
    </div>
    <div class="w-fit text-5xl font-base">
      Available items at {{ merchantState?.merchant_name }}
    </div>
    <div class="w-fit text-base">
      Select a item to start browsing items and placing your order.
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
      v-for="item of filteredCenters"
      v-if="items != undefined && error == null"
    >
      <Item
        variant="outline"
        class="cursor-pointer"
        @click="updateitemState(item)"
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
          <ItemTitle>{{ item.item_name }}</ItemTitle>
        </ItemContent>
      </Item>
    </div>
    <div v-else-if="error != null">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BadgeAlert />
          </EmptyMedia>
          <EmptyTitle>No Item Found</EmptyTitle>
          <EmptyDescription>
            Available items will be shown here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
        <Button
        v-else-if="items == undefined && error == null"
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