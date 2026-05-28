"use client"

import * as React from "react"
import * as Select from "@radix-ui/react-select"
import { ChevronDown, Check, Search } from "lucide-react"

import { cn } from "@/lib/utils"

export type SelectMenuOption = {
  value: string
  label: string
}

type SelectMenuProps = {
  value?: string
  onValueChange?: (value: string) => void
  options?: SelectMenuOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  inputClassName?: string
}

const defaultMenuItems: SelectMenuOption[] = [
  { value: "United States of America", label: "United States of America" },
  { value: "Albania", label: "Albania" },
  { value: "Algeria", label: "Algeria" },
  { value: "Andorra", label: "Andorra" },
  { value: "Argentina", label: "Argentina" },
  { value: "Armenia", label: "Armenia" },
  { value: "Austria", label: "Austria" },
  { value: "Australia", label: "Australia" },
  { value: "Azerbaijan", label: "Azerbaijan" },
  { value: "Bahamas", label: "Bahamas" },
  { value: "Brazil", label: "Brazil" },
  { value: "Canada", label: "Canada" },
  { value: "Colombia", label: "Colombia" },
  { value: "China", label: "China" },
  { value: "Egypt", label: "Egypt" },
  { value: "France", label: "France" },
  { value: "Germany", label: "Germany" },
  { value: "India", label: "India" },
  { value: "Iraq", label: "Iraq" },
]

export default function SelectMenu({
  value,
  onValueChange,
  options = defaultMenuItems,
  placeholder = "Select your country",
  searchPlaceholder = "Search",
  emptyMessage = "Nothing found.",
  className,
  triggerClassName,
  contentClassName,
  inputClassName,
}: SelectMenuProps) {
  const [internalValue, setInternalValue] = React.useState("")
  const [items, setItems] = React.useState(options)

  const selectedValue = value ?? internalValue
  const handleValueChange = onValueChange ?? setInternalValue

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value
    const results = options.filter((item) =>
      item.label.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
    )

    setTimeout(() => setItems(results), 100)
  }

  React.useEffect(() => {
    setItems(options)
  }, [options])

  return (
    <Select.Root
      value={selectedValue}
      onValueChange={handleValueChange}
      onOpenChange={(open) => {
        if (open) {
          setItems(options)
        }
      }}
    >
      <div className={cn("w-72 max-w-full", className)}>
        <Select.Trigger
          className={cn(
            "inline-flex h-10 w-full items-center justify-between rounded-full border border-white/15 bg-white/10 px-4 text-sm text-[#f4f1e8] shadow-sm outline-none backdrop-blur transition-colors focus:border-white/30 focus:ring-0",
            triggerClassName
          )}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon className="text-[#f4f1e8]/70">
            <ChevronDown className="h-5 w-5" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            avoidCollisions={false}
            className={cn(
              "z-[70] mt-3 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-white/15 bg-[#17355a] text-sm text-white shadow-[0_18px_50px_rgba(36,91,176,0.24)]",
              contentClassName
            )}
          >
            <div className="flex items-center border-b border-white/10 bg-white/5 shadow-sm">
              <Search className="mx-3 h-6 w-6 text-white/55" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full bg-transparent p-2 text-white/90 outline-none placeholder:text-white/45",
                  inputClassName
                )}
                onChange={handleSearch}
              />
            </div>
            <Select.Viewport className="mt-2 max-h-64 overflow-y-auto">
              {items.length < 1 ? (
                <div className="px-3 py-2 text-white/70">{emptyMessage}</div>
              ) : null}
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </div>
    </Select.Root>
  )
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof Select.Item>,
  React.ComponentPropsWithoutRef<typeof Select.Item>
>(({ children, className, ...props }, forwardedRef) => {
  return (
    <Select.Item
      ref={forwardedRef}
      className={cn(
        "flex cursor-default items-center justify-between px-3 py-2 text-white/85 outline-none duration-150 data-[state=checked]:bg-white/10 data-[state=checked]:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[highlighted]:hover:bg-white/10 data-[highlighted]:hover:text-white",
        className
      )}
      {...props}
    >
      <Select.ItemText>
        <div className="pr-4 line-clamp-1">{children}</div>
      </Select.ItemText>
      <div className="w-6">
        <Select.ItemIndicator>
          <Check className="h-5 w-5 text-[#62f4da]" />
        </Select.ItemIndicator>
      </div>
    </Select.Item>
  )
})

SelectItem.displayName = "SelectItem"