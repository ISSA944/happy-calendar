import { type ReactNode } from 'react'
import { Drawer } from 'vaul'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  description?: string
  headerRight?: ReactNode
  hideDragIndicator?: boolean
  /** When false, disables swipe-to-close — sheet closes only via buttons. Default: true */
  draggable?: boolean
  fixedViewportHeight?: boolean
  onClosed?: () => void
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  headerRight,
  hideDragIndicator = false,
  draggable = true,
  fixedViewportHeight = false,
  onClosed,
}: BottomSheetProps) {
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      dismissible={draggable}
      onAnimationEnd={open => { if (!open && !isOpen) onClosed?.() }}
    >
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 bg-black/40 transition-opacity" 
          style={{ zIndex: 100 }} 
        />
        <Drawer.Content
          className="bg-[#fcf9f4] flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] landscape:max-h-[90vh] outline-none mx-auto w-full max-w-md landscape:max-w-xl shadow-2xl"
          {...(!description ? { 'aria-describedby': undefined } : {})}
          style={{ zIndex: 101, height: fixedViewportHeight ? 'min(82dvh, 760px)' : undefined, paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          {description && <Drawer.Description className="sr-only">{description}</Drawer.Description>}
          {/* Header zone — drag handle + title/actions */}
          <div
            className="px-6 pt-3 pb-4"
            style={{ paddingBottom: title || headerRight ? '10px' : '16px' }}
          >
            {!hideDragIndicator && draggable && (
              <div className="w-9 h-[5px] bg-on-surface-variant/25 rounded-full mx-auto mb-3" />
            )}
            
            {(title || headerRight) && (
              <div className="flex justify-between items-center mt-1">
                <div className="flex-1 min-w-0">
                  {typeof title === 'string' ? (
                    <Drawer.Title className="font-headline text-lg font-bold text-on-surface">
                      {title}
                    </Drawer.Title>
                  ) : (
                    title ? <Drawer.Title asChild>{title}</Drawer.Title> : null
                  )}
                </div>
                {headerRight && (
                  <div className="flex-shrink-0">
                    {headerRight}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`flex flex-col flex-1 min-h-0 ${fixedViewportHeight ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
