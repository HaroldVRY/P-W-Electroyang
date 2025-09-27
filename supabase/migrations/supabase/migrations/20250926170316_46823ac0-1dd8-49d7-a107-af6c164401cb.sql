-- Create RPC functions for wallet operations

-- Function to increment wallet balance atomically
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  p_user_id UUID,
  p_credits NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallets 
  SET 
    balance_credits = balance_credits + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to decrement wallet balance atomically (with balance check)
CREATE OR REPLACE FUNCTION public.decrement_wallet_balance(
  p_user_id UUID,
  p_credits NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Check current balance first
  SELECT balance_credits INTO current_balance
  FROM public.wallets 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;
  
  IF current_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient balance: % < %', current_balance, p_credits;
  END IF;
  
  -- Perform the update
  UPDATE public.wallets 
  SET 
    balance_credits = balance_credits - p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Function to process complete credits settlement transaction
CREATE OR REPLACE FUNCTION public.process_credits_settlement(
  p_generator_id UUID,
  p_consumption_wh NUMERIC,
  p_generation_wh NUMERIC,
  p_excedente_wh NUMERIC,
  p_credits_awarded NUMERIC,
  p_owner_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_timestamp TIMESTAMP WITH TIME ZONE;
  v_client_tx_id TEXT;
BEGIN
  v_timestamp := NOW();
  v_client_tx_id := 'settlement_' || p_generator_id || '_' || EXTRACT(EPOCH FROM v_timestamp);
  
  -- Insert excedente record
  INSERT INTO public.excedentes (
    generator_id,
    consumption_wh,
    generation_wh, 
    excedente_wh,
    ts
  ) VALUES (
    p_generator_id,
    p_consumption_wh,
    p_generation_wh,
    p_excedente_wh,
    v_timestamp
  );
  
  -- Update wallet balance
  UPDATE public.wallets 
  SET 
    balance_credits = balance_credits + p_credits_awarded,
    updated_at = v_timestamp
  WHERE user_id = p_owner_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_owner_user_id;
  END IF;
  
  -- Create transaction record
  INSERT INTO public.transactions (
    from_user,
    to_user,
    credits,
    source,
    client_tx_id,
    proof_hash,
    ts
  ) VALUES (
    NULL,
    p_owner_user_id,
    p_credits_awarded,
    'generator',
    v_client_tx_id,
    'settlement_' || p_generator_id || '_' || v_timestamp,
    v_timestamp
  );
  
  RETURN TRUE;
END;
$$;