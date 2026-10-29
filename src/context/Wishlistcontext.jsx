import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/*
 * Saved stays, kept in memory for this visit.
 * Phase 2 will load and save this list through the API for signed-in users.
 */

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([])

  const has = useCallback((id) => ids.includes(id), [ids])

  const toggle = useCallback((id) => {
    setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  const value = useMemo(
    () => ({ ids, count: ids.length, has, toggle, clear }),
    [ids, has, toggle, clear],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return ctx
}