<script setup lang="ts">
import { useRoute } from 'vue-router'
import { TvIcon, FilmIcon, CalendarDaysIcon, UserIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import type { NavItem } from '@/types'

const route = useRoute()

const navItems: NavItem[] = [
  { label: 'Live TV', icon: 'tv', route: '/' },
  { label: 'VOD', icon: 'film', route: '/vod' },
  { label: 'Harmonogram', icon: 'calendar', route: '/schedule' },
  { label: 'Mój Profil', icon: 'user', route: '/profile' },
  { label: 'Ustawienia', icon: 'cog', route: '/settings' },
]

const iconMap: Record<string, any> = {
  tv: TvIcon,
  film: FilmIcon,
  calendar: CalendarDaysIcon,
  user: UserIcon,
  cog: Cog6ToothIcon,
}

function isActive(item: NavItem): boolean {
  if (item.route === '/') return route.path === '/'
  return route.path.startsWith(item.route)
}
</script>

<template>
  <nav class="sidebar">
    <div class="nav-list">
      <router-link
        v-for="item in navItems"
        :key="item.route"
        :to="item.route"
        class="nav-item"
        :class="{ active: isActive(item) }"
      >
        <component :is="iconMap[item.icon]" class="nav-icon" />
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  padding: 8px 0;
  overflow-y: auto;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 8px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-muted);
  transition: filter 0.2s;
  cursor: pointer;
}

.nav-item:hover {
  filter: brightness(1.1);
}

.nav-item.active {
  background: var(--accent-red-muted);
  color: var(--accent-red);
}

.nav-icon {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 8px;
  font-weight: 500;
  text-align: center;
  line-height: 1.1;
  white-space: nowrap;
  color: var(--text-dark);
}
</style>
