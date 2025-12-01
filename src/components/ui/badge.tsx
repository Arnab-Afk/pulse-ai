import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-500/20",
                outline: 
                    "text-foreground",
                active: 
                    "border-transparent bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
                stale: 
                    "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                blocked: 
                    "border-transparent bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
                completed: 
                    "border-transparent bg-muted text-muted-foreground",
                success:
                    "border-transparent bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
                warning:
                    "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                info:
                    "border-transparent bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
