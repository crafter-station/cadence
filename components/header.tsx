import { Activity, ChevronDown, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center bg-foreground">
                <Activity className="h-4 w-4 text-background" />
              </div>
              <span className="font-medium tracking-tight">cadence</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="border-b-2 border-foreground rounded-none">
                Evaluation
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-none">
                History
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-none">
                Agents
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-none">
                Analytics
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="hidden sm:flex gap-2">
                  <span className="text-muted-foreground">Environment</span>
                  <Badge variant="outline" className="font-normal">Production</Badge>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Production</DropdownMenuItem>
                <DropdownMenuItem>Staging</DropdownMenuItem>
                <DropdownMenuItem>Development</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                JD
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
