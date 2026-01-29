import { ReactNode, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, User, LogOut, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { useStudents } from "@/hooks/useStudents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  timestamp: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Welcome to EduCore",
      message: "Your student management system is ready to use.",
      type: "info",
      read: false,
      timestamp: new Date().toISOString(),
    },
  ]);
  
  const { user, role, signOut, isMasterAdmin } = useAuth();
  const { formattedTime, isWarning } = useSessionTimer();
  const navigate = useNavigate();

  // Search for students based on query
  const { data: searchResults, isLoading: searchLoading } = useStudents({
    search: searchQuery,
  });

  // Fetch recent activity for notifications
  const { data: recentFees } = useQuery({
    queryKey: ["pendingFeesNotification"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fees")
        .select("id, description, amount, student_id")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // Generate notifications from data
  useEffect(() => {
    const newNotifications: Notification[] = [
      {
        id: "welcome",
        title: "Welcome to EduCore",
        message: "Your student management system is ready to use.",
        type: "info" as const,
        read: true,
        timestamp: new Date().toISOString(),
      },
    ];

    if (recentFees && recentFees.length > 0) {
      newNotifications.unshift({
        id: "pending-fees",
        title: "Pending Fees",
        message: `You have ${recentFees.length} pending fee${recentFees.length > 1 ? "s" : ""} to collect.`,
        type: "warning" as const,
        read: false,
        timestamp: new Date().toISOString(),
      });
    }

    setNotifications(newNotifications);
  }, [recentFees]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length > 0);
  }, []);

  const handleStudentClick = (studentId: string) => {
    navigate(`/students/${studentId}`);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getRoleLabel = () => {
    if (isMasterAdmin) return "Master Admin";
    if (role === "staff") return "Staff";
    return "User";
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "success": return "bg-success/20 text-success";
      case "warning": return "bg-warning/20 text-warning";
      case "error": return "bg-destructive/20 text-destructive";
      default: return "bg-primary/20 text-primary";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Navigation Bar */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              
              {/* Omni-Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students by ID, name, or phone..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  className="search-input w-80"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-auto z-50">
                    {searchLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchResults && searchResults.length > 0 ? (
                      <div className="py-2">
                        <p className="px-4 py-2 text-xs text-muted-foreground font-medium">
                          Found {searchResults.length} student{searchResults.length !== 1 ? "s" : ""}
                        </p>
                        {searchResults.slice(0, 10).map((student) => (
                          <button
                            key={student.id}
                            onClick={() => handleStudentClick(student.id)}
                            className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                          >
                            {student.photo_url ? (
                              <img
                                src={student.photo_url}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {student.first_name[0]}{student.last_name[0]}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.student_id} • Class {student.class}
                              </p>
                            </div>
                          </button>
                        ))}
                        {searchResults.length > 10 && (
                          <button
                            onClick={() => {
                              navigate(`/students?search=${encodeURIComponent(searchQuery)}`);
                              setShowSearchResults(false);
                            }}
                            className="w-full px-4 py-2 text-sm text-primary hover:bg-muted/50 text-center"
                          >
                            View all {searchResults.length} results
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No students found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Session Timer */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isWarning ? "bg-warning/20 text-warning" : "bg-secondary/50 text-muted-foreground"
              }`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">{formattedTime}</span>
              </div>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border ${
                            !notification.read ? "border-primary/30 bg-primary/5" : "border-border"
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                              <Bell className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate("/notifications")}
                  >
                    View All Notifications
                  </Button>
                </PopoverContent>
              </Popover>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="font-medium text-sm">{user?.email?.split("@")[0] || "User"}</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {getRoleLabel()}
                      </Badge>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/")}>Dashboard</DropdownMenuItem>
                  {isMasterAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/staff")}>Staff Management</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/audit")}>Audit Logs</DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
