import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { runMigrationIfNeeded } from './db/migrate'
import { purgeExpiredCache } from './lib/aiCache'
import { useDebtStore } from './store/useDebtStore'
import { useScheduleStore } from './store/useScheduleStore'
import { useGoalStore } from './store/useGoalStore'
import { useTodoStore } from './store/useTodoStore'
import { useKesibukanStore } from './store/useKesibukanStore'

async function bootstrap() {
  await runMigrationIfNeeded()
  await Promise.all([
    useDebtStore.getState()._hydrate(),
    useScheduleStore.getState()._hydrate(),
    useGoalStore.getState()._hydrate(),
    useTodoStore.getState()._hydrate(),
    useKesibukanStore.getState()._hydrate(),
  ])
  await purgeExpiredCache()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
