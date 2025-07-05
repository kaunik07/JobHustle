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
  FormDescription,
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
import { Switch } from '../ui/switch';

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
  isUsCitizenOnly: z.boolean().default(false),
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
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
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
      isUsCitizenOnly: false,
    },
  });

  React.useEffect(() => {
    form.setValue('userId', selectedUserId);
  }, [selectedUserId, form]);

  const handleAnalyzeDescription = async () => {
    const jobDescription = form.getValues('jobDescription');
    if (!jobDescription || jobDescription.trim().length < 20) {
      form.setError('jobDescription', { message: 'Please provide a job description to analyze.' });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await fetchJobDescription({ jobDescription });
      if (result && result.isUsCitizenOnly !== undefined) {
        form.setValue('isUsCitizenOnly', result.isUsCitizenOnly, { shouldValidate: true });
        toast({ title: 'Analysis Complete', description: 'Citizenship requirement has been updated.' });
      } else {
        toast({ variant: 'destructive', title: 'Could not analyze', description: 'The AI could not determine the citizenship requirement.' });
      }
    } catch (error) {
      console.error('Error analyzing job description:', error);
      toast({ variant: 'destructive', title: 'Analysis Error', description: 'An error occurred during analysis.' });
    } finally {
      setIsAnalyzing(false);
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
        isUsCitizenOnly: false,
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
                    <FormControl>
                        <Input placeholder="https://example.com/job/123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Job Description</FormLabel>
                      <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAnalyzeDescription}
                            disabled={isAnalyzing}
                            className="gap-1.5"
                        >
                            {isAnalyzing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Bot className="h-4 w-4" />
                            )}
                            Analyze Description
                        </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the job description here, then click Analyze."
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
              <FormField
                control={form.control}
                name="isUsCitizenOnly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>US Citizen Only</FormLabel>
                      <FormDescription>
                        Check if this job requires US citizenship.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
