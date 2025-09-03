import { createPoll, getPolls, deletePoll } from '../poll-actions';
import { createServerClient } from '../../supabase-server';
import { revalidatePath } from 'next/cache';

jest.mock('../../supabase-server');
jest.mock('next/cache');

describe('poll-actions', () => {
  let mockSupabase: any;
  let singleMock: jest.Mock;
  let selectEqMock: jest.Mock;
  let deleteEqMock: jest.Mock;
  let orderMock: jest.Mock;
  let selectMock: jest.Mock;
  let pollInsertMock: jest.Mock;
  let pollDeleteMock: jest.Mock;
  let optionsInsertMock: jest.Mock;
  let rpcMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mocks for chained calls
    singleMock = jest.fn();
    selectEqMock = jest.fn().mockReturnValue({ single: singleMock });
    deleteEqMock = jest.fn();
    orderMock = jest.fn();
    selectMock = jest.fn().mockReturnValue({ eq: selectEqMock, order: orderMock });
    pollInsertMock = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleMock }) });
    pollDeleteMock = jest.fn().mockReturnValue({ eq: deleteEqMock });
    optionsInsertMock = jest.fn();
    rpcMock = jest.fn();

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn((tableName: string) => {
        if (tableName === 'polls') {
          return {
            select: selectMock,
            insert: pollInsertMock,
            delete: pollDeleteMock,
          };
        }
        if (tableName === 'poll_options') { // Corrected table name
          return {
            insert: optionsInsertMock,
          };
        }
        return {};
      }),
      rpc: rpcMock,
    };

    (createServerClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('createPoll', () => {
    it('should return an error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await createPoll(new FormData());
      expect(result).toEqual({ error: 'You must be logged in to create a poll' });
    });

    it('should return an error if title or options are missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      const formData = new FormData();
      formData.append('title', 'Test Poll');
      const result = await createPoll(formData);
      expect(result).toEqual({ error: 'Title and at least 2 options are required' });
    });

    it('should create a poll successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      // Mock for the poll insertion returning the new poll's ID
      singleMock.mockResolvedValueOnce({ data: { id: 'poll-1' }, error: null });
      // Mock for the options insertion
      optionsInsertMock.mockResolvedValueOnce({ error: null });

      const formData = new FormData();
      formData.append('title', 'Test Poll');
      formData.append('options[]', 'Option 1');
      formData.append('options[]', 'Option 2');

      const result = await createPoll(formData);

      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/polls');
      // Verify that the correct tables were called
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
      expect(mockSupabase.from).toHaveBeenCalledWith('poll_options');
    });
  });

  describe('getPolls', () => {
    it('should fetch polls with vote counts', async () => {
      const polls = [{ id: 'poll-1', title: 'Test Poll' }];
      orderMock.mockResolvedValue({ data: polls, error: null });
      rpcMock.mockResolvedValue({ data: 5, error: null });

      const result = await getPolls();

      expect(result.polls).toHaveLength(1);
      expect(result.polls[0].total_votes).toBe(5);
    });
  });

  describe('deletePoll', () => {
    it('should return an error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await deletePoll('poll-1');
      expect(result).toEqual({ error: 'You must be logged in to delete a poll' });
    });

    it('should return an error if poll not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      singleMock.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const result = await deletePoll('poll-1');
      expect(result).toEqual({ error: 'Poll not found' });
    });

    it('should return an error if user is not the owner', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      singleMock.mockResolvedValue({ data: { user_id: 'user-2' }, error: null });
      const result = await deletePoll('poll-1');
      expect(result).toEqual({ error: 'You can only delete your own polls' });
    });

    it('should delete a poll successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
      // Mock for checking ownership
      singleMock.mockResolvedValueOnce({ data: { user_id: 'user-1' }, error: null });
      // Mock for the delete operation
      deleteEqMock.mockResolvedValueOnce({ error: null });

      const result = await deletePoll('poll-1');

      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/polls');
    });
  });
});