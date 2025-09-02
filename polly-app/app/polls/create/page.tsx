'use client'

import withAuth from '@/app/components/withAuth'
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
// Import the action through a client-side wrapper
import { createPoll as createPollAction } from '@/lib/actions/poll-actions';

// Define form schema with Zod
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  options: z.array(
    z.object({
      text: z.string().min(1, { message: 'Option text is required' })
    })
  ).min(2, { message: 'At least 2 options are required' }),
  allowMultipleVotes: z.boolean().default(false),
  hideResults: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

function CreatePollPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      options: [{ text: '' }, { text: '' }],
      allowMultipleVotes: false,
      hideResults: false,
    },
  });

  // Add a new option field
  const addOption = () => {
    const currentOptions = form.getValues('options');
    form.setValue('options', [...currentOptions, { text: '' }]);
  };

  // Remove an option field
  const removeOption = (index: number) => {
    const currentOptions = form.getValues('options');
    if (currentOptions.length <= 2) return; // Maintain minimum 2 options
    form.setValue('options', currentOptions.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Show loading toast
      toast.loading('Creating your poll...');
      
      const result = await createPollAction(data);
      
      if (result?.error) {
        toast.dismiss();
        toast.error(result.error);
        setError(result.error);
      } else if (result?.success) {
        toast.dismiss();
        toast.success('Poll created successfully!');
        // Navigate to polls list
        router.push('/polls');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('An unexpected error occurred');
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Link 
        href="/polls" 
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to Polls
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Poll</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poll Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter poll title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <textarea 
                        className="w-full px-3 py-2 border rounded-md" 
                        rows={3}
                        placeholder="Enter poll description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <FormLabel>Poll Options</FormLabel>
                {form.watch('options').map((_, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`options.${index}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder={`Option ${index + 1}`} {...field} />
                          </FormControl>
                          {form.watch('options').length > 2 && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon"
                              onClick={() => removeOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addOption}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Another Option
                </Button>
              </div>
              
              <div className="space-y-4">
                <FormLabel>Poll Settings</FormLabel>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="allowMultipleVotes"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mr-2"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Allow multiple votes per user</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hideResults"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mr-2"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Hide results until voting ends</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(CreatePollPage)