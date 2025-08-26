'use client'

import withAuth from '@/app/components/withAuth'
import React from 'react';
import Link from 'next/link';

// Mock data for a single poll
const mockPoll = {
  id: 1,
  title: 'Favorite Programming Language',
  description: 'Vote for your favorite programming language in 2023',
  createdBy: 'John Doe',
  createdAt: '2023-05-15',
  options: [
    { id: 1, text: 'JavaScript', votes: 45 },
    { id: 2, text: 'Python', votes: 38 },
    { id: 3, text: 'TypeScript', votes: 27 },
    { id: 4, text: 'Rust', votes: 10 },
  ],
};

function PollPage({ params }: { params: { id: string } }) {
  const totalVotes = mockPoll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <div className="container mx-auto py-10 px-4">
      <Link 
        href="/polls" 
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to Polls
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{mockPoll.title}</h1>
        <p className="text-gray-600 mb-4">{mockPoll.description}</p>
        <div className="text-sm text-gray-500 mb-6">
          Created by {mockPoll.createdBy} on {mockPoll.createdAt}
        </div>

        <div className="space-y-4">
          {mockPoll.options.map((option) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            
            return (
              <div key={option.id} className="border rounded-md p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{option.text}</span>
                  <span className="text-gray-500">{option.votes} votes ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Cast Your Vote</h2>
        <form className="space-y-4">
          {mockPoll.options.map((option) => (
            <div key={option.id} className="flex items-center">
              <input
                type="radio"
                id={`option-${option.id}`}
                name="poll-vote"
                className="mr-3"
              />
              <label htmlFor={`option-${option.id}`}>{option.text}</label>
            </div>
          ))}
          
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Submit Vote
          </button>
        </form>
      </div>
    </div>
  );
}

export default withAuth(PollPage)