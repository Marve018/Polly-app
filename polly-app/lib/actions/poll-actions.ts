'use server'

import { createServerActionClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type Poll = {
  id: string
  title: string
  description: string | null
  user_id: string
  created_at: string
  total_votes: number
}

export async function createPoll(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'You must be logged in to create a poll' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const options = formData.getAll('options[]') as string[]

    if (!title || options.length < 2) {
      return { error: 'Title and at least 2 options are required' }
    }

    // Insert the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert([
        {
          title,
          description: description || null,
          user_id: user.id,
        },
      ])
      .select()
      .single()

    if (pollError) {
      console.error('Error creating poll:', pollError)
      return { error: 'Failed to create poll' }
    }

    // Insert the options
    const optionsToInsert = options
      .filter(option => option.trim() !== '')
      .map(option => ({
        poll_id: poll.id,
        text: option,
      }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert)

    if (optionsError) {
      console.error('Error creating poll options:', optionsError)
      return { error: 'Failed to create poll options' }
    }

    revalidatePath('/polls')
    return { success: true }
  } catch (error) {
    console.error('Error in createPoll:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getPolls() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    // Get all polls
    const { data: polls, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching polls:', error)
      return { error: 'Failed to fetch polls' }
    }

    // Get vote counts for each poll
    const pollsWithTotalVotes = await Promise.all(
      polls.map(async (poll) => {
        const { data: vote_count, error: rpcError } = await supabase.rpc('get_poll_vote_count', {
          poll_id: poll.id,
        })

        if (rpcError) {
          console.error(`Error fetching vote count for poll ${poll.id}:`, rpcError)
        }

        return {
          ...poll,
          total_votes: vote_count || 0,
        }
      })
    )

    return { polls: pollsWithTotalVotes }
  } catch (error) {
    console.error('Error in getPolls:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deletePoll(pollId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'You must be logged in to delete a poll' }
    }

    // Check if the poll belongs to the user
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return { error: 'Poll not found' }
    }

    if (poll.user_id !== user.id) {
      return { error: 'You can only delete your own polls' }
    }

    // Delete the poll (options will be cascade deleted due to foreign key constraint)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)

    if (deleteError) {
      console.error('Error deleting poll:', deleteError)
      return { error: 'Failed to delete poll' }
    }

    revalidatePath('/polls')
    return { success: true }
  } catch (error) {
    console.error('Error in deletePoll:', error)
    return { error: 'An unexpected error occurred' }
  }
}