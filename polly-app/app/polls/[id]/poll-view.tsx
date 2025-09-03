'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { type PollWithOptions, submitVote } from '@/lib/actions/poll-actions';

export default function PollView({ poll }: { poll: PollWithOptions }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalVotes = poll.poll_options.reduce(
    (sum, option) => sum + option.votes,
    0
  );

  const handleVote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOption) {
      toast.error('Please select an option to vote');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitVote(poll.id, selectedOption);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Vote submitted successfully!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/polls" className="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Polls
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{poll.title}</h1>
        {poll.description && (
          <p className="text-gray-600 mb-4">{poll.description}</p>
        )}
        <div className="text-sm text-gray-500 mb-6">
          Created on {new Date(poll.created_at).toLocaleDateString()}
        </div>

        <div className="space-y-4">
          {poll.poll_options.map((option) => {
            const percentage =
              totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

            return (
              <div key={option.id} className="border rounded-md p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{option.text}</span>
                  <span className="text-gray-500">
                    {option.votes} votes ({percentage}%)
                  </span>
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
        <form onSubmit={handleVote} className="space-y-4">
          {poll.poll_options.map((option) => (
            <div key={option.id} className="flex items-center">
              <input
                type="radio"
                id={`option-${option.id}`}
                name="poll-vote"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
                className="mr-3"
              />
              <label htmlFor={`option-${option.id}`}>{option.text}</label>
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Vote'}
          </button>
        </form>
      </div>
    </div>
  );
}