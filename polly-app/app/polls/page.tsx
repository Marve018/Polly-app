import { getPolls, type Poll } from '@/lib/actions/poll-actions'
import { createServerClient } from '@/lib/supabase-server'
import PollsClientPage from './polls-client-page'

export default async function PollsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { polls, error } = await getPolls()

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return <PollsClientPage polls={polls as Poll[]} user={user} />
}