"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

interface DropdownItem {
  id: string | number
  label: string
  icon?: React.ReactNode
}

interface BasicDropdownProps {
  label: string
  items: DropdownItem[]
  onChange?: (item: DropdownItem) => void
  className?: string
  highlightId?: string | number
}

export default function BasicDropdown({
  label,
  items,
  onChange,
  className = "",
  highlightId,
}: BasicDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<"down" | "up">("down")

  const handleItemSelect = (item: DropdownItem) => {
    setSelectedItem(item)
    setIsOpen(false)
    onChange?.(item)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Choose placement based on available space
  useLayoutEffect(() => {
    if (!isOpen) return
    const trigger = dropdownRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const estimatedMenuHeight = menuRef.current?.offsetHeight || 240 // fallback
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
      setPlacement("up")
    } else {
      setPlacement("down")
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-gray-50 flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-2 text-left transition-colors"
      >
        <span className="block truncate">
          {selectedItem ? selectedItem.label : label}
        </span>
          <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className={`bg-white absolute left-0 z-10 w-full rounded-lg border shadow-lg ${
              placement === "down" ? "mt-1 origin-top" : "mb-1 bottom-full origin-bottom"
            }`}
            initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{
              opacity: 0,
              y: -10,
              scaleY: 0.8,
              transition: { duration: 0.2 },
            }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          >
            <ul
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="dropdown-button"
            >
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  role="menuitem"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="block"
                  whileHover={{ x: 5 }}
                >
                  <button
                    onClick={() => handleItemSelect(item)}
                    className={`flex w-full items-center px-4 py-2 text-left text-sm rounded-md transition-colors
                      ${selectedItem?.id === item.id ? "bg-blue-50 text-blue-700" : ""}
                      ${highlightId === item.id ? "bg-blue-50/70 text-blue-700" : ""}
                      hover:bg-gray-50`}
                  >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}

                    {(selectedItem?.id === item.id || highlightId === item.id) && (
                      <motion.span
                        className="ml-auto"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <svg
                          className="text-brand h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.span>
                    )}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
