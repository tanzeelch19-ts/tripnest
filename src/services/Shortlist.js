import { useSyncExternalStore } from 'react'

/*
 * Compare list (up to 3 stays) and recently viewed stays (up to 6).
 * Both are saved in this browser and shared by every component through one store.
 */

const COMPARE_KEY = 'tripnest-compare'
const RECENT_KEY = 'tripnest-recent'
export const MAX_COMPARE = 3
const MAX_RECENT = 6

const readList = (key) => {
  try {
    const list = JSON.parse(localStorage.getItem(key))
    return Array.isArray(list) ? list.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}
const writeList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* storage blocked: keep working in memory */
  }
}

// Snapshots are cached so React sees the same array until something changes.
let compare = readList(COMPARE_KEY)
let recent = readList(RECENT_KEY)
const listeners = new Set()
const notify = () => listeners.forEach((listener) => listener())
const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function toggleCompare(id) {
  if (compare.includes(id)) {
    compare = compare.filter((x) => x !== id)
  } else if (compare.length < MAX_COMPARE) {
    compare = [...compare, id]
  } else {
    return false // the list is full
  }
  writeList(COMPARE_KEY, compare)
  notify()
  return true
}

export function clearCompare() {
  compare = []
  writeList(COMPARE_KEY, compare)
  notify()
}

export function addRecent(id) {
  recent = [id, ...recent.filter((x) => x !== id)].slice(0, MAX_RECENT)
  writeList(RECENT_KEY, recent)
  notify()
}

export const useCompareIds = () => useSyncExternalStore(subscribe, () => compare, () => [])
export const useRecentIds = () => useSyncExternalStore(subscribe, () => recent, () => [])