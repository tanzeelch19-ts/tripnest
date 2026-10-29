/**
 * One layout for empty and error states, so every page says what happened
 * and what to do next in the same way.
 */
export default function StateMessage({ title, children, action, tone = 'neutral' }) {
  return (
    <div
      className="mx-auto my-8 flex max-w-[34rem] flex-col items-center gap-3 px-4 py-[clamp(2rem,6vw,3.5rem)] text-center"
      role={tone === 'error' ? 'alert' : undefined}
    >
      <h2 className={`text-2xl ${tone === 'error' ? 'text-danger' : ''}`}>{title}</h2>
      {children ? <p className="max-w-[44ch] text-ink-2">{children}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}