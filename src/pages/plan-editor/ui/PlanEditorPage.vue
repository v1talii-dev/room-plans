<script setup>
import { AppToast } from '@/shared/ui'
import { AppToolbar } from '@/widgets/toolbar'
import { PlanCanvas } from '@/widgets/plan-canvas'
import { SidePanel } from '@/widgets/side-panel'
import { ExportDialog, exportOpen } from '@/features/export-layout'
import { VariantDialog, pendingVariant } from '@/features/apply-variant'
import { CreateItemDialog, createOpen } from '@/features/create-item'
import { RoomsDialog, roomsOpen } from '@/features/manage-rooms'
import { useHotkeys } from '../lib/useHotkeys.js'

useHotkeys()
</script>

<template>
  <div class="app">
    <AppToolbar />
    <main class="main">
      <PlanCanvas />
      <SidePanel />
    </main>
    <ExportDialog v-if="exportOpen" />
    <VariantDialog v-else-if="pendingVariant" />
    <CreateItemDialog v-else-if="createOpen" />
    <RoomsDialog v-else-if="roomsOpen" />
    <AppToast />
  </div>
</template>
