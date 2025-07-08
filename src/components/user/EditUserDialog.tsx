
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil, Trash2, Plus } from 'lucide-react';
import { updateUser as updateUserAction } from '@/app/actions';
import type { User } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  emails: z.array(z.string().email()).min(1, 'At least one email is required.'),
  defaultEmail: z.string().email('A default email is required.'),
}).refine(data => data.emails.includes(data.defaultEmail), {
  message: 'Default email must be in the email list.',
  path: ['defaultEmail'],
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserDialogProps {
  user: User;
  children: React.ReactNode;
}

export function EditUserDialog({ user, children }: EditUserDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const [newEmail, setNewEmail] = React.useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      emails: user.emails,
      defaultEmail: user.defaultEmail,
    },
  });
  
  React.useEffect(() => {
    if (open) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        emails: user.emails,
        defaultEmail: user.defaultEmail,
      });
      setNewEmail('');
    }
  }, [open, user, form]);

  const handleAddEmail = () => {
    const emailSchema = z.string().email();
    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
      return;
    }
    const currentEmails = form.getValues('emails');
    if (currentEmails.includes(newEmail)) {
        toast({ variant: 'destructive', title: 'Email exists', description: 'This email is already in the list.' });
        return;
    }
    form.setValue('emails', [...currentEmails, newEmail]);
    setNewEmail('');
  };
  
  const handleRemoveEmail = (emailToRemove: string) => {
    const currentEmails = form.getValues('emails');
    if (currentEmails.length <= 1) {
        toast({ variant: 'destructive', title: 'Cannot remove', description: 'You must have at least one email.' });
        return;
    }
    const newEmails = currentEmails.filter(email => email !== emailToRemove);
    form.setValue('emails', newEmails);

    // If the default email was removed, set the first in the new list as default
    if (form.getValues('defaultEmail') === emailToRemove) {
      form.setValue('defaultEmail', newEmails[0]);
    }
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await updateUserAction(user.id, values);
      toast({
        title: 'User Updated',
        description: `${values.firstName} ${values.lastName}'s profile has been updated.`,
      });
      setOpen(false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error updating user',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update the name and manage email addresses for {user.firstName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="defaultEmail"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Email Addresses (select default)</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          {form.watch('emails').map((email) => (
                            <div key={email} className="flex items-center justify-between group">
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value={email} />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                    {email}
                                    </FormLabel>
                                </FormItem>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                    onClick={() => handleRemoveEmail(email)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Input
                    placeholder="Add new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); }}}
                  />
                  <Button type="button" variant="outline" onClick={handleAddEmail}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t mt-auto bg-background">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
