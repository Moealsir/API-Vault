import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  MoreVertical, 
  Trash2, 
  Plus, 
  Copy, 
  Key, 
  Clock 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { type ProjectWithSecrets, type SecretWithDecrypted } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import AddSecretDialog from "./add-secret-dialog";
import EditSecretDialog from "./edit-secret-dialog";

interface ProjectCardProps {
  project: ProjectWithSecrets;
}

const platformColors: Record<string, string> = {
  Google: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  AWS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Stripe: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  GitHub: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Custom: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

const secretTypeColors: Record<string, string> = {
  "API Key": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Client ID": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Client Secret": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "Access Token": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddSecret, setShowAddSecret] = useState(false);
  const [editingSecret, setEditingSecret] = useState<SecretWithDecrypted | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deletingSecret, setDeletingSecret] = useState<string | null>(null);

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/projects/${project.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const deleteSecretMutation = useMutation({
    mutationFn: async (secretId: string) => {
      await apiRequest("DELETE", `/api/secrets/${secretId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Secret deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeletingSecret(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete secret",
        variant: "destructive",
      });
      setDeletingSecret(null);
    },
  });

  const copyToClipboard = async (secretId: string) => {
    try {
      const response = await fetch(`/api/secrets/${secretId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch secret");
      }
      
      const secret: SecretWithDecrypted = await response.json();
      
      // Format the key-value pairs for copying
      const formattedValues = Object.entries(secret.decryptedValues)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      await navigator.clipboard.writeText(formattedValues);
      toast({
        title: "Copied!",
        description: "Secret values copied to clipboard",
      });
    } catch (error) {
      if (error instanceof Error && isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to copy secret",
        variant: "destructive",
      });
    }
  };

  const handleEditSecret = async (secretId: string) => {
    try {
      const response = await fetch(`/api/secrets/${secretId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch secret");
      }
      
      const secret: SecretWithDecrypted = await response.json();
      setEditingSecret(secret);
    } catch (error) {
      if (error instanceof Error && isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to load secret",
        variant: "destructive",
      });
    }
  };

  const maskSecretValue = (value: string) => {
    if (value.length <= 8) {
      return "••••••••";
    }
    return value.slice(0, 4) + "••••••••••••••••••••••••";
  };

  return (
    <>
      <Card className="overflow-hidden" data-testid={`card-project-${project.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-foreground" data-testid={`text-project-name-${project.id}`}>
                  {project.name}
                </h3>
                {project.platforms?.map((platform) => (
                  <Badge 
                    key={platform} 
                    variant="secondary" 
                    className={platformColors[platform] || platformColors.Custom}
                    data-testid={`badge-platform-${platform.toLowerCase()}`}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground" data-testid={`text-project-description-${project.id}`}>
                  {project.description}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid={`button-project-menu-${project.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {}}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeletingProject(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Project Stats */}
          <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Key className="h-4 w-4 mr-1" />
              <span data-testid={`text-secret-count-${project.id}`}>{project.secretCount}</span> secrets
            </span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Updated {formatDistanceToNow(new Date(project.updatedAt || new Date()), { addSuffix: true })}
            </span>
          </div>

          {/* Collapsible Secrets Section */}
          <div className="border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-left p-0 h-auto font-medium hover:bg-transparent"
              data-testid={`button-toggle-secrets-${project.id}`}
            >
              <span>View Secrets</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            
            {isExpanded && (
              <div className="mt-4 space-y-4" data-testid={`secrets-list-${project.id}`}>
                {project.secrets && project.secrets.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b">
                      <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <div className="col-span-3">Name</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Platform</div>
                        <div className="col-span-3">Keys</div>
                        <div className="col-span-2">Actions</div>
                      </div>
                    </div>
                    
                    {project.secrets.map((secret) => (
                      <div key={secret.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                            <span className="text-sm font-medium text-foreground" data-testid={`text-secret-name-${secret.id}`}>
                              {secret.name}
                            </span>
                          </div>
                          
                          <div className="col-span-2">
                            <Badge 
                              variant="secondary"
                              className={secretTypeColors[secret.type] || secretTypeColors["API Key"]}
                            >
                              {secret.type}
                            </Badge>
                          </div>
                          
                          <div className="col-span-2">
                            <Badge 
                              variant="secondary"
                              className={platformColors[secret.platform] || platformColors.Custom}
                            >
                              {secret.platform}
                            </Badge>
                          </div>
                          
                          <div className="col-span-3">
                            <div className="flex flex-wrap gap-1">
                              {secret.encryptedValues && typeof secret.encryptedValues === 'object' ? 
                                Object.keys(secret.encryptedValues).map((key) => (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}
                                  </Badge>
                                )) : 
                                <Badge variant="outline" className="text-xs">
                                  value
                                </Badge>
                              }
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(secret.id)}
                                className="h-8 w-8 p-0"
                                data-testid={`button-copy-${secret.id}`}
                                title="Copy secret values"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSecret(secret.id)}
                                className="h-8 w-8 p-0"
                                data-testid={`button-edit-secret-${secret.id}`}
                                title="Edit secret"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingSecret(secret.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                data-testid={`button-delete-secret-${secret.id}`}
                                title="Delete secret"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No secrets yet</p>
                  </div>
                )}

                {/* Add Secret Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowAddSecret(true)}
                  className="w-full border-dashed"
                  data-testid={`button-add-secret-${project.id}`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Secret
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Secret Dialog */}
      <AddSecretDialog
        open={showAddSecret}
        onOpenChange={setShowAddSecret}
        projectId={project.id}
      />

      {/* Edit Secret Dialog */}
      {editingSecret && (
        <EditSecretDialog
          open={!!editingSecret}
          onOpenChange={(open: boolean) => !open && setEditingSecret(null)}
          secret={editingSecret}
        />
      )}

      {/* Delete Project Confirmation */}
      <AlertDialog open={deletingProject} onOpenChange={setDeletingProject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This will permanently delete the project and all its secrets. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-project"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Secret Confirmation */}
      <AlertDialog open={!!deletingSecret} onOpenChange={(open) => !open && setDeletingSecret(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Secret</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this secret? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSecret && deleteSecretMutation.mutate(deletingSecret)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-secret"
            >
              Delete Secret
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
