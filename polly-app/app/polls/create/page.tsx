'use client'

import withAuth from '@/app/components/withAuth'
import React from 'react';
import Link from 'next/link';

function CreatePollPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <Link 
        href="/polls" 
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to Polls
      </Link>

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Poll</h1>
        
        <form className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Poll Title</label>
            <input
              id="title"
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter poll title"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
            <textarea
              id="description"
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter poll description"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Poll Options</label>
            <div className="space-y-3">
              {[1, 2].map((index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder={`Option ${index}`}
                  />
                  {index > 2 && (
                    <button
                      type="button"
                      className="px-3 py-2 border rounded-md text-red-500 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              className="mt-2 text-blue-600 hover:underline text-sm"
            >
              + Add Another Option
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Poll Settings</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="multiple-votes"
                  type="checkbox"
                  className="mr-2"
                />
                <label htmlFor="multiple-votes">Allow multiple votes per user</label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="hide-results"
                  type="checkbox"
                  className="mr-2"
                />
                <label htmlFor="hide-results">Hide results until voting ends</label>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Poll
          </button>
        </form>
      </div>
    </div>
  );
}

export default withAuth(CreatePollPage)