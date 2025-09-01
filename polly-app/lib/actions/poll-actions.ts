'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type PollOption = {
  text: string
}

export type PollFormData = {
  title: string
  description?: string
  options: PollOption[]
  allowMultipleVotes: boolean
  hideResults: boolean
}

export async function createPoll(formData: PollFormData) {
  const supabase = await createServerClient()
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'You must be logged in to create a poll' }
    }
    
    // Validate form data
    if (!formData.title.trim()) {
      return { error: 'Poll title is required' }
    }
    
    if (formData.options.length < 2) {
      return { error: 'Poll must have at least 2 options' }
    }
    
    if (formData.options.some(option => !option.text.trim())) {
      return { error: 'All poll options must have text' }
    }
    
    // Insert poll into database
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: formData.title,
        description: formData.description || null,
        user_id: user.id,
        allow_multiple_votes: formData.allowMultipleVotes,
        hide_results: formData.hideResults
      })
      .select()
      .single()
    
    if (pollError) {
      console.error('Error creating poll:', pollError)
      return { error: 'Failed to create poll' }
    }
    
    // Insert poll options
    const pollOptions = formData.options.map(option => ({
      poll_id: poll.id,
      text: option.text,
    }))
    
    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions)
    
    if (optionsError) {
      console.error('Error creating poll options:', optionsError)
      return { error: 'Failed to create poll options' }
    }
    
    // Revalidate the polls page to show the new poll
    revalidatePath('/polls')
    
    // Return success with poll ID
    return { success: true, pollId: poll.id }
    
  } catch (error) {
    console.error('Error in createPoll:', error)
    return { error: 'An unexpected error occurred' }
  }
}