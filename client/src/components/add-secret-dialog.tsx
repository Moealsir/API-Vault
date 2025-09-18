import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertSecretSchema } from "@shared/schema";

interface AddSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

// Create a form schema that matches the new structure
const formSchema = z.object({
  name: z.string().min(1, "Secret name is required"),
  type: z.string().min(1, "Secret type is required"),
  platform: z.string().min(1, "Platform is required"),
  projectId: z.string(),
  keyValuePairs: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    value: z.string().min(1, "Value is required"),
  })).min(1, "At least one key-value pair is required"),
});

const secretTypes = [
  "API Key",
  "Client ID", 
  "Client Secret",
  "Access Token",
  "Custom"
];

const platforms = [
  "Google",
  "AWS",
  "Stripe", 
  "GitHub",
  "Custom"
];

export default function AddSecretDialog({ open, onOpenChange, projectId }: AddSecretDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "API Key",
      platform: "Custom",
      projectId,
      keyValuePairs: [{ key: "", value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyValuePairs",
  });

  const createSecretMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Transform the form data to match the API schema
      const values: Record<string, string> = {};
      data.keyValuePairs.forEach(pair => {
        values[pair.key] = pair.value;
      });
      
      const apiData = {
        name: data.name,
        type: data.type,
        platform: data.platform,
        projectId: data.projectId,
        values,
      };
      
      const response = await apiRequest("POST", "/api/secrets", apiData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Secret created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset({
        name: "",
        type: "API Key",
        platform: "Custom",
        projectId,
        keyValuePairs: [{ key: "", value: "" }],
      });
      onOpenChange(false);
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
        description: "Failed to create secret",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createSecretMutation.mutate({ ...data, projectId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Secret</DialogTitle>
          <DialogDescription>
            Add a new API secret to this project. All values are encrypted using AES-256 encryption.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Stripe Live Key, Google OAuth Client" 
                      {...field} 
                      data-testid="input-secret-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-secret-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {secretTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-secret-platform">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Key-Value Pairs</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: "", value: "" })}
                  className="flex items-center space-x-1"
                  data-testid="button-add-key-value"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Pair</span>
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start space-x-2">
                  <FormField
                    control={form.control}
                    name={`keyValuePairs.${index}.key`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        {index === 0 && <FormLabel>Key</FormLabel>}
                        <FormControl>
                          <Input
                            placeholder="e.g., api_key, client_id"
                            {...field}
                            data-testid={`input-key-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`keyValuePairs.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        {index === 0 && <FormLabel>Value</FormLabel>}
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter the secret value"
                            {...field}
                            data-testid={`input-value-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      className="mt-6 p-2"
                      data-testid={`button-remove-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-secret"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSecretMutation.isPending}
                data-testid="button-create-secret"
              >
                {createSecretMutation.isPending ? "Creating..." : "Create Secret"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
