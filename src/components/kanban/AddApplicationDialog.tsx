
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
import { User, categories, statuses, applicationTypes, suggestedLocations, workArrangements } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronsUpDown, Check, X, Plus, Bot } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { addApplication as addApplicationAction } from '@/app/actions';
import { fetchJobDescription } from '@/ai/flows/fetch-job-description';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  locations: z.array(z.string()).min(1, 'At least one location is required'),
  jobUrl: z.string().url('Please enter a valid URL'),
  jobDescription: z.string().optional(),
  type: z.enum(applicationTypes),
  category: z.enum(categories),
  workArrangement: z.enum(workArrangements),
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
  const [isFetchingDetails, setIsFetchingDetails] = React.useState(false);
  const [locationsPopoverOpen, setLocationsPopoverOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      jobTitle: '',
      jobUrl: '',
      locations: [],
      jobDescription: '',
      type: 'Full-Time',
      category: 'SWE',
      workArrangement: 'On-site',
      status: 'Yet to Apply',
      userId: selectedUserId,
      notes: '',
    },
  });

  React.useEffect(() => {
    form.setValue('userId', selectedUserId);
  }, [selectedUserId, form]);

  const handleFetchJobDetails = async () => {
    const jobUrl = form.getValues('jobUrl');
    const urlCheck = z.string().url().safeParse(jobUrl);
    if (!urlCheck.success) {
      form.setError('jobUrl', { message: 'Please enter a valid URL to fetch.' });
      return;
    }

    setIsFetchingDetails(true);
    try {
      const details = await fetchJobDescription({ jobUrl });
      if (details) {
        if(details.companyName) form.setValue('companyName', details.companyName, { shouldValidate: true });
        if(details.jobTitle) form.setValue('jobTitle', details.jobTitle, { shouldValidate: true });
        if(details.location) form.setValue('locations', [details.location], { shouldValidate: true });
        if(details.type) form.setValue('type', details.type, { shouldValidate: true });
        if(details.category) form.setValue('category', details.category, { shouldValidate: true });
        if(details.workArrangement) form.setValue('workArrangement', details.workArrangement, { shouldValidate: true });
        if(details.jobDescription) form.setValue('jobDescription', details.jobDescription, { shouldValidate: true });

        toast({ title: 'Success', description: 'Job details have been auto-filled.' });
      } else {
        toast({ variant: 'destructive', title: 'Could not fetch details', description: 'The AI could not extract job details from the URL. Please fill them in manually.' });
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({ variant: 'destructive', title: 'Fetch Error', description: 'An error occurred while fetching job details.' });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await addApplicationAction(values as any);

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
        jobDescription: '',
        userId: selectedUserId,
        status: 'Yet to Apply',
        workArrangement: 'On-site',
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
    return [...new Set([...suggestedLocations, ...allLocations])];
  }, [allLocations]);

  const displayLocations = React.useMemo(() => {
    if (!inputValue) {
      return allUniqueLocations.slice(0, 5);
    }
    return allUniqueLocations.filter(loc => 
      loc.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, allUniqueLocations]);

  const handleLocationSelect = (location: string) => {
    const currentLocations = form.getValues('locations') || [];
    const newLocations = currentLocations.includes(location)
      ? currentLocations.filter(l => l !== location)
      : [...currentLocations, location];
    form.setValue('locations', newLocations, { shouldValidate: true });
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && inputValue) {
        e.preventDefault();
        handleLocationSelect(inputValue);
    }
  };

  const handleItemSelect = (location: string) => {
    handleLocationSelect(location);
    setInputValue('');
  };

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
                      <Popover open={locationsPopoverOpen} onOpenChange={setLocationsPopoverOpen}>
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
                                      onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleItemSelect(location)
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
                           <Command onKeyDown={handleKeyDown}>
                            <CommandInput 
                              placeholder="Search location..."
                              value={inputValue}
                              onValueChange={setInputValue}
                            />
                            <CommandList>
                              <CommandEmpty>No location found.</CommandEmpty>
                              <CommandGroup>
                                {displayLocations.map((location) => {
                                  const isSelected = field.value?.includes(location);
                                   return (
                                    <CommandItem
                                      key={location}
                                      value={location}
                                      onSelect={() => handleItemSelect(location)}
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
                                {inputValue && !displayLocations.some(loc => loc.toLowerCase() === inputValue.toLowerCase()) && (
                                    <CommandItem
                                        key={inputValue}
                                        value={inputValue}
                                        onSelect={() => handleItemSelect(inputValue)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add "{inputValue}"
                                    </CommandItem>
                                )}
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
                    <div className="flex items-center gap-2">
                        <FormControl>
                            <Input placeholder="https://example.com/job/123" {...field} />
                        </FormControl>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleFetchJobDetails}
                            disabled={isFetchingDetails}
                            title="Auto-fill with AI"
                        >
                            {isFetchingDetails ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Bot className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the job description here, or fetch it from the URL above."
                        className="min-h-[120px]"
                        {...field}
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
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
              <FormField
                  control={form.control}
                  name="workArrangement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Arrangement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an arrangement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workArrangements.map(wa => (
                            <SelectItem key={wa} value={wa}>{wa}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
