"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { authManager } from "@/lib/auth"
import { useEffect, useState } from "react"

interface NavItem {
  title: string
  href: string
  roles?: string[] // Optional roles that can access this nav item
}

export function MainNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get user role and login status
    if (typeof window !== 'undefined') {
      const role = authManager.getUserRole()
      const loggedIn = authManager.isLoggedIn()
      
      setUserRole(role)
      setIsLoggedIn(loggedIn)
      setMounted(true)
    }
  }, [])

  const navItems: NavItem[] = [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Capture",
      href: "/capture",
      roles: ["farmer"],
    },
    {
      title: "Dashboard",
      href: "/researcher",
      roles: ["researcher"],
    },
    {
      title: "Lab Portal",
      href: "/researcher/lab",
      roles: ["researcher"],
    },
    {
      title: "Lab",
      href: "/lab",
      roles: ["lab"],
    },
    {
      title: "Processing",
      href: "/processing",
      roles: ["processor"],
    },
    {
      title: "Admin",
      href: "/admin/dashboard",
      roles: ["admin"],
    },
    {
      title: "Audit Logs",
      href: "/admin/audit-logs",
      roles: ["admin"],
    },
    {
      title: "IPFS Storage",
      href: "/demo/ipfs-upload",
      roles: ["farmer", "lab", "processor", "admin", "researcher"],
    },
    {
      title: "ZK Proofs",
      href: "/demo/zkp",
      roles: ["farmer", "lab", "processor", "admin", "researcher"],
    },
    {
      title: "Verify",
      href: "/verify",
    },
    {
      title: "Batches",
      href: "/batches",
      roles: ["farmer", "lab", "processor", "admin", "researcher"],
    },
    {
      title: "History",
      href: "/history",
      roles: ["farmer"],
    },
    {
      title: "Settings",
      href: "/settings",
    },
  ]

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    // If no roles specified, show to everyone
    if (!item.roles) return true
    
    // If roles specified, check if user has the required role
    return item.roles.includes(userRole || "")
  })

  // Don't render navigation until client-side hydration is complete
  if (!mounted) return null;
  
  // Don't show navigation on login and onboarding pages
  if (pathname === '/login' || pathname === '/researcher-login' || pathname === '/onboarding') {
    return null;
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-2">
      <div className="flex justify-around items-center">
        {filteredNavItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-16 w-16 rounded-lg",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            asChild
          >
            <Link href={item.href as string}>
              <span className="text-xs mt-1">{item.title}</span>
            </Link>
          </Button>
        ))}

        {isLoggedIn && (
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center h-16 w-16 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              authManager.logout()
              window.location.href = "/login"
            }}
          >
            <span className="text-xs mt-1">Logout</span>
          </Button>
        )}
      </div>
    </nav>
  )
}