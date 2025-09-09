import { getPoll, PollWithOptions } from "@/lib/actions/poll-actions";
import PollView from "./poll-view";
import { Suspense } from "react";

export default function PollPage({ params }: { params: { id: string } }) {
  // The getPoll function is async and will be awaited inside PollPageContent
  const pollDetails = getPoll(params.id);

  return (
    <Suspense fallback={<div className="container mx-auto py-10 px-4">Loading poll...</div>}>
      <PollPageContent pollDetails={pollDetails} />
    </Suspense>
  );
}

async function PollPageContent({
  pollDetails,
}: {
  pollDetails: Promise<{ poll?: PollWithOptions; error?: string }>;
}) {
  const { poll, error } = await pollDetails;

  if (error || !poll) {
    return (
      <div className="container mx-auto py-10 px-4 text-red-500">
        {error || "Poll not found"}
      </div>
    );
  }

  return <PollView poll={poll} />;
}
