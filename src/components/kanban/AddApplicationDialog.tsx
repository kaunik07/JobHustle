'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, categories, statuses, applicationTypes, suggestedLocations } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronsUpDown, Check, X, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { addApplication as addApplicationAction } from '@/app/actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  locations: z.array(z.string()).min(1, 'At least one location is required'),
  jobUrl: z.string().url('Please enter a valid URL'),
  type: z.enum(applicationTypes),
  category: z.enum(categories),
  status: z.enum(statuses),
  userId: z.string().min(1, 'User is required'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddApplicationDialogProps {
  children?: React.ReactNode;
  users: User[];
  selectedUserId: string;
  allLocations: string[];
}

export function AddApplicationDialog({ children, users, selectedUserId, allLocations }: AddApplicationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [locationsPopoverOpen, setLocationsPopoverOpen] = React.useState(false);
  const [locationSearch, setLocationSearch] = React.useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      jobTitle: '',
      jobUrl: '',
      locations: [],
      type: 'Full-Time',
      category: 'SWE',
      status: 'Yet to Apply',
      userId: selectedUserId,
      notes: '',
    },
  });

  React.useEffect(() => {
    form.setValue('userId', selectedUserId);
  }, [selectedUserId, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await addApplicationAction(values);

      toast({
        title: 'Application Added',
        description: `${values.jobTitle} at ${values.companyName} has been added for ${values.locations.length} location(s).`,
      });
      setOpen(false);
      form.reset({
        ...form.getValues(),
        companyName: '',
        jobTitle: '',
        jobUrl: '',
        locations: [],
        notes: '',
        userId: selectedUserId,
        status: 'Yet to Apply',
        type: 'Full-Time',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add application.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const allUniqueLocations = React.useMemo(() => {
    const combined = [...suggestedLocations, ...allLocations];
    const unique = Array.from(new Set(combined));
    const finalOrder = [...suggestedLocations.filter(l => unique.includes(l)), ...unique.filter(l => !suggestedLocations.includes(l))];
    return finalOrder;
  }, [allLocations]);

  const locationsToShow = React.useMemo(() => {
    if (!locationSearch) {
        return allUniqueLocations.slice(0, 5);
    }
    return allUniqueLocations.filter(loc => 
        loc.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [locationSearch, allUniqueLocations]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>+ Add Application</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="font-headline">Add New Application</DialogTitle>
          <DialogDescription>
            Enter the details of your job application.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Innovate Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Frontend Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locations"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Location(s)</FormLabel>
                      <Popover open={locationsPopoverOpen} onOpenChange={(isOpen) => {
                        setLocationsPopoverOpen(isOpen);
                        if (!isOpen) {
                            setLocationSearch('');
                        }
                      }}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={locationsPopoverOpen}
                              className={cn(
                                "w-full justify-between h-auto min-h-10",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              <div className="flex gap-1 flex-wrap">
                                {field.value?.length > 0 ? (
                                  field.value.map((location) => (
                                    <Badge
                                      variant="secondary"
                                      key={location}
                                      className="mr-1"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newLocations = field.value.filter((value) => value !== location);
                                        field.onChange(newLocations);
                                      }}
                                    >
                                      {location}
                                      <X className="ml-1 h-3 w-3" />
                                    </Badge>
                                  ))
                                ) : (
                                  "Select locations"
                                )}
                              </div>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.contains(e.target as HTMLElement)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <CommandInput 
                              placeholder="Search location..."
                              value={locationSearch}
                              onValueChange={setLocationSearch}
                            />
                            <CommandList>
                               {locationsToShow.length === 0 && locationSearch && !field.value.includes(locationSearch) ? (
                                <CommandItem
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onSelect={() => {
                                    field.onChange([...(field.value || []), locationSearch]);
                                    setLocationSearch('');
                                  }}
                                  value={locationSearch}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add "{locationSearch}"
                                </CommandItem>
                              ) : (
                                <CommandEmpty>No location found.</CommandEmpty>
                              )}
                              <CommandGroup>
                                {locationsToShow.map((location) => {
                                  const isSelected = field.value?.includes(location);
                                   return (
                                    <CommandItem
                                      key={location}
                                      value={location}
                                      onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onSelect={() => {
                                        if (isSelected) {
                                          field.onChange(field.value.filter(l => l !== location));
                                        } else {
                                          field.onChange([...(field.value || []), location]);
                                        }
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {location}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Posting URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/job/123" {...field} />
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
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {applicationTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>{`${user.firstName} ${user.lastName}`.trim()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statuses.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any extra details here..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="p-6 pt-4 flex-shrink-0 border-t bg-background">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
