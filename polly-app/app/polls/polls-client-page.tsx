'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { deletePoll, type Poll } from '@/lib/actions/poll-actions'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

type PollsClientPageProps = {
  polls: Poll[]
  user: any
}

export default function PollsClientPage({ polls, user }: PollsClientPageProps) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleDelete = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) {
      return
    }

    try {
      const result = await deletePoll(pollId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Poll deleted successfully')
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting poll:', error)
      toast.error('Failed to delete poll')
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Polls</h1>
          {user && <p className="text-gray-500">Welcome, {user.email}</p>}
        </div>
        <div>
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition mr-4"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition mr-4"
            >
              Login
            </Link>
          )}
          <Link
            href="/polls/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Poll
          </Link>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">No polls found. Create your first poll!</p>
          <Link
            href="/polls/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Poll
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <Card key={poll.id} className="relative">
              <Link href={`/polls/${poll.id}`}>
                <div className="p-6 hover:bg-gray-50 transition cursor-pointer">
                  <h2 className="text-xl font-semibold mb-2">{poll.title}</h2>
                  {poll.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {poll.description}
                    </p>
                  )}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{poll.total_votes} votes</span>
                    <span>
                      Created: {new Date(poll.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
              {user && poll.user_id === user.id && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <Link href={`/polls/${poll.id}/edit`}>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(poll.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}