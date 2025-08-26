'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import Link from 'next/link'

// Mock data for polls
const mockPolls = [
  { id: 1, title: 'Favorite Programming Language', votes: 120, createdAt: '2023-05-15' },
  { id: 2, title: 'Best Frontend Framework', votes: 85, createdAt: '2023-05-18' },
  { id: 3, title: 'Most Important Developer Skill', votes: 64, createdAt: '2023-05-20' },
];

export default function PollsPage() {
  const { user, supabase } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockPolls.map((poll) => (
          <Link key={poll.id} href={`/polls/${poll.id}`}>
            <div className="border rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">{poll.title}</h2>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{poll.votes} votes</span>
                <span>Created: {poll.createdAt}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}