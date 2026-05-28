import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SearchInputProps = React.ComponentProps<typeof Input> & {
  wrapperClassName?: string
  iconClassName?: string
}

export function SearchInput({
  className,
  wrapperClassName,
  iconClassName,
  ...props
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 shadow-sm",
        wrapperClassName
      )}
    >
      <Search className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      <Input
        className={cn("border-0 bg-transparent px-0 text-sm focus-visible:ring-0", className)}
        {...props}
      />
    </div>
  )
}