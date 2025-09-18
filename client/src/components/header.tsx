import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, Search, ChevronDown, User, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const getUserInitials = () => {
    const userTyped = user as any;
    if (userTyped?.firstName && userTyped?.lastName) {
      return `${userTyped.firstName.charAt(0)}${userTyped.lastName.charAt(0)}`;
    }
    if (userTyped?.firstName) {
      return userTyped.firstName.charAt(0);
    }
    if (userTyped?.email) {
      return userTyped.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    const userTyped = user as any;
    if (userTyped?.firstName && userTyped?.lastName) {
      return `${userTyped.firstName} ${userTyped.lastName}`;
    }
    if (userTyped?.firstName) {
      return userTyped.firstName;
    }
    if (userTyped?.email) {
      return userTyped.email;
    }
    return "User";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="text-primary text-2xl" />
            <h1 className="text-xl font-bold text-foreground">SecureVault</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search Bar - Hidden on mobile */}
          {!isMobile && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search secrets, projects..."
                className="pl-10 pr-4 py-2 w-64"
                value={searchQuery}
                onChange={handleSearchChange}
                data-testid="input-global-search"
              />
            </div>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 text-sm px-3 py-2"
                data-testid="button-user-menu"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {!isMobile && (
                  <span className="font-medium">{getUserDisplayName()}</span>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{getUserDisplayName()}</span>
                  {(user as any)?.email && (
                    <span className="text-xs text-muted-foreground">{(user as any).email}</span>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => window.location.href = '/api/logout'}
                className="flex items-center space-x-2 text-destructive focus:text-destructive"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isMobile && (
        <div className="border-t border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search secrets, projects..."
              className="pl-10 pr-4 py-2 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
              data-testid="input-mobile-search"
            />
          </div>
        </div>
      )}
    </header>
  );
}
