-- SQL function to reset the transactions table sequence
-- Run this in your Supabase SQL editor or database client

CREATE OR REPLACE FUNCTION reset_transactions_sequence(next_val INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Reset the sequence to the specified value
  PERFORM setval('transactions_id_seq', next_val, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: If you need to fix the sequence immediately, run this:
-- SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id) FROM transactions), 0) + 1, false);

-- To check the current sequence value:
-- SELECT currval('transactions_id_seq');

-- To check the maximum ID in the table:
-- SELECT MAX(id) FROM transactions;
