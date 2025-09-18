import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Folder, Key, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { type ProjectWithSecrets } from "@shared/schema";
import Header from "@/components/header";
import ProjectCard from "@/components/project-card";
import AddProjectDialog from "@/components/add-project-dialog";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  // Fetch projects with search and filter
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: [
      "/api/projects",
      ...(searchQuery ? [`search=${encodeURIComponent(searchQuery)}`] : []),
      ...(platformFilter ? [`platform=${encodeURIComponent(platformFilter)}`] : [])
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (platformFilter) params.append('platform', platformFilter);
      const query = params.toString();
      const url = `/api/projects${query ? `?${query}` : ''}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handlePlatformFilter = (platform: string) => {
    setPlatformFilter(platform === "all" ? "" : platform);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      
      <main className="flex-1">
        <div className="container mx-auto p-6 space-y-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground mt-1">Manage your API secrets and projects securely</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Platform Filter */}
              <Select value={platformFilter || "all"} onValueChange={handlePlatformFilter}>
                <SelectTrigger className="w-48" data-testid="select-platform-filter">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="AWS">AWS</SelectItem>
                  <SelectItem value="Stripe">Stripe</SelectItem>
                  <SelectItem value="GitHub">GitHub</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Add Project Button */}
              <Button 
                onClick={() => setShowAddProject(true)}
                className="inline-flex items-center space-x-2"
                data-testid="button-add-project"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-total-projects">
                      {(stats as any)?.totalProjects || 0}
                    </p>
                  </div>
                  <Folder className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Secrets</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-total-secrets">
                      {(stats as any)?.totalSecrets || 0}
                    </p>
                  </div>
                  <Key className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platforms</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-total-platforms">
                      {(stats as any)?.totalPlatforms || 0}
                    </p>
                  </div>
                  <Cloud className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (projects as any[]).length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(projects as any[]).map((project: ProjectWithSecrets) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12" data-testid="empty-state">
              <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || platformFilter ? 'No matching projects' : 'No Projects Yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || platformFilter 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first project to start managing your API secrets securely.'
                }
              </p>
              {!searchQuery && !platformFilter && (
                <Button 
                  onClick={() => setShowAddProject(true)}
                  className="inline-flex items-center space-x-2"
                  data-testid="button-create-first-project"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Project</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions FAB */}
        <div className="fixed bottom-6 right-6">
          <Button 
            onClick={() => setShowAddProject(true)}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            data-testid="button-fab-add"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </main>

      {/* Add Project Dialog */}
      <AddProjectDialog 
        open={showAddProject}
        onOpenChange={setShowAddProject}
      />
    </div>
  );
}
