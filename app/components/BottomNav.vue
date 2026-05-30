<template>
  <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
    <NuxtLink to="/dashboard" class="nav-item" :class="{ 'nav-item--active': route.path === '/dashboard' }"
      aria-label="Dashboard">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      <span class="nav-label">Home</span>
    </NuxtLink>

    <NuxtLink to="/statistics" class="nav-item" :class="{ 'nav-item--active': route.path === '/statistics' }"
      aria-label="Statistics">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
      <span class="nav-label">Stats</span>
    </NuxtLink>

    <NuxtLink to="/history?create=true" class="nav-item nav-item--fab" aria-label="Quick add entry">
      <span class="fab">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
      <span class="nav-label nav-label--fab">Add</span>
    </NuxtLink>

    <NuxtLink to="/history" class="nav-item"
      :class="{ 'nav-item--active': route.path === '/history' && !route.query.create }" aria-label="History">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="12" y2="16" />
      </svg>
      <span class="nav-label">History</span>
    </NuxtLink>

    <NuxtLink to="/settings" class="nav-item" :class="{ 'nav-item--active': route.path === '/settings' }"
      aria-label="Settings">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
      <span class="nav-label">Settings</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
const route = useRoute()
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-height, 64px);
  background: #fff;
  border-top: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 6px 12px;
  text-decoration: none;
  color: var(--color-text-muted, #64748b);
  transition: color 0.15s ease;
}

.nav-item--active {
  color: var(--color-primary, #2563eb);
}

.nav-item--fab {
  position: relative;
}

.fab {
  width: var(--fab-size, 56px);
  height: var(--fab-size, 56px);
  border-radius: 50%;
  background: var(--color-primary, #2563eb);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  transition: transform 0.12s ease;
}

.fab:active {
  transform: translateX(-50%) scale(0.93);
}

.nav-label {
  font-size: 0.625rem;
  font-weight: 600;
  margin-top: 2px;
}

.nav-label--fab {
  margin-top: 30px;
}
</style>
