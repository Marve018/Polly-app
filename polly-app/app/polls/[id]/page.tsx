import { getPoll } from "@/lib/actions/poll-actions";
import PollView from "./poll-view";

export default async function PollPage({ params }: { params: { id: string } }) {
  const { poll, error } = await getPoll(params.id);

  if (error || !poll) {
    return (
      <div className="container mx-auto py-10 px-4 text-red-500">
        {error || "Poll not found"}
      </div>
    );
  }

  return <PollView poll={poll} />;
}