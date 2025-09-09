"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "../supabase-server";

export type Poll = {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  total_votes: number;
};

export type PollOption = {
  id: string;
  text: string;
  poll_id: string;
};

export type PollWithOptions = Poll & {
  poll_options: (Omit<PollOption, "poll_id"> & { votes: number })[];
};

export async function createPoll(formData: FormData) {
  const supabase = await createServerClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "You must be logged in to create a poll" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const options = formData.getAll("options[]") as string[];

    if (!title || options.length < 2) {
      return { error: "Title and at least 2 options are required" };
    }

    // Insert the poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert([
        {
          title,
          description: description || null,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (pollError) {
      console.error("Error creating poll:", pollError);
      return { error: "Failed to create poll" };
    }

    // Insert the options
    const optionsToInsert = options
      .filter((option) => option.trim() !== "")
      .map((option) => ({
        poll_id: poll.id,
        text: option,
      }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsToInsert);

    if (optionsError) {
      console.error("Error creating poll options:", optionsError);
      return { error: "Failed to create poll options" };
    }

    revalidatePath("/polls");
    return { success: true };
  } catch (error) {
    console.error("Error in createPoll:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function getPolls() {
  const supabase = await createServerClient();

  try {
    // Get all polls
    const { data: polls, error } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching polls:", error);
      return { error: "Failed to fetch polls" };
    }

    // Get vote counts for each poll using direct query
    const pollsWithTotalVotes = await Promise.all(
      polls.map(async (poll) => {
        const { count: vote_count, error: voteError } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", poll.id);

        if (voteError) {
          console.error(
            `Error fetching vote count for poll ${poll.id}:`,
            voteError
          );
        }

        return {
          ...poll,
          total_votes: vote_count || 0,
        };
      })
    );

    return { polls: pollsWithTotalVotes };
  } catch (error) {
    console.error("Error in getPolls:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function getPoll(
  id: string
): Promise<{ poll?: PollWithOptions; error?: string }> {
  const supabase = await createServerClient();

  try {
    const { data: poll, error } = await supabase
      .from("polls")
      .select(
        `
        *,
        poll_options (
          id,
          text
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !poll) {
      console.error("Error fetching poll:", error);
      return { error: "Poll not found" };
    }

    // Get vote counts for each option using direct query
    const optionsWithVotes = await Promise.all(
      (poll.poll_options as PollOption[]).map(async (option) => {
        const { count: vote_count, error: voteError } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_option_id", option.id);

        if (voteError) {
          console.error(
            `Error fetching vote count for option ${option.id}:`,
            voteError
          );
        }

        return {
          ...option,
          votes: vote_count || 0,
        };
      })
    );

    const pollWithOptions: PollWithOptions = {
      ...(poll as Poll),
      poll_options: optionsWithVotes,
    };

    return { poll: pollWithOptions };
  } catch (error) {
    console.error("Error in getPoll:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function deletePoll(pollId: string) {
  const supabase = await createServerClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "You must be logged in to delete a poll" };
    }

    // Check if the poll belongs to the user
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("user_id")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      return { error: "Poll not found" };
    }

    if (poll.user_id !== user.id) {
      return { error: "You can only delete your own polls" };
    }

    // Delete the poll (options will be cascade deleted due to foreign key constraint)
    const { error: deleteError } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

    if (deleteError) {
      console.error("Error deleting poll:", deleteError);
      return { error: "Failed to delete poll" };
    }

    revalidatePath("/polls");
    return { success: true };
  } catch (error) {
    console.error("Error in deletePoll:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function submitVote(pollId: string, pollOptionId: string) {
  const supabase = await createServerClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "You must be logged in to vote" };
    }

    // Check if the user has already voted on this poll
    const { data: existingVote, error: voteCheckError } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (voteCheckError && voteCheckError.code !== "PGRST116") {
      // PGRST116: 'No rows found'
      console.error("Error checking for existing vote:", voteCheckError);
      return { error: "Failed to check for existing vote" };
    }

    if (existingVote) {
      return { error: "You have already voted on this poll" };
    }

    // Insert the new vote
    const { error: insertError } = await supabase.from("votes").insert({
      poll_id: pollId,
      poll_option_id: pollOptionId,
      user_id: user.id,
    });

    if (insertError) {
      console.error("Error submitting vote:", insertError);
      return { error: "Failed to submit vote" };
    }

    revalidatePath(`/polls/${pollId}`);
    return { success: true };
  } catch (error) {
    console.error("Error in submitVote:", error);
    return { error: "An unexpected error occurred" };
  }
}
