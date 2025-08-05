-- SQL Script to run in Supabase SQL Editor
-- This will create the necessary function to execute SQL from our application

-- Create a function to execute SQL statements
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count integer;
  result_data json;
BEGIN
  -- Execute the SQL query
  EXECUTE sql_query;
  
  -- Get the number of affected rows
  GET DIAGNOSTICS result_count = ROW_COUNT;
  
  -- Return success with row count
  RETURN json_build_object(
    'success', true, 
    'rows_affected', result_count,
    'message', 'Query executed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'message', 'Query execution failed'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;

-- Create a safer function for SELECT queries
CREATE OR REPLACE FUNCTION query_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data json;
BEGIN
  -- Only allow SELECT statements for safety
  IF upper(trim(sql_query)) NOT LIKE 'SELECT%' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only SELECT statements are allowed',
      'message', 'Use exec_sql for non-SELECT queries'
    );
  END IF;
  
  -- Execute the SELECT query and return results as JSON
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result_data;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(result_data, '[]'::json),
    'message', 'Query executed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'message', 'Query execution failed'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION query_sql(text) TO authenticated;