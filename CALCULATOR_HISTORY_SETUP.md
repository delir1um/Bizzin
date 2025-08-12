# Calculator History Setup Guide

## Database Setup Required

Before the calculator history feature works, you need to create the database table in Supabase.

### Steps:

1. **Go to Supabase Dashboard**
   - Open your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the SQL Script**
   - Copy and paste the contents of `database/calculator_history_table.sql` into the SQL editor
   - Click "Run" to execute the SQL

3. **Verify Table Creation**
   - Go to Table Editor in Supabase
   - You should see a new table called `calculator_history`

## What's Been Implemented

### ✅ Phase 1 Calculators with History:
- **Cash Flow Projection Calculator** - New "History" tab added
- **Break-Even Calculator** - Ready for history integration  
- **Business Budget Calculator** - Ready for history integration

### 🔧 Features Added:
- **Save Calculations** - Users can name and save their current calculations
- **Load Previous Calculations** - Select and load any saved calculation
- **Search History** - Find specific calculations by name or notes
- **Delete Calculations** - Remove unwanted saved calculations
- **Notes Support** - Add notes to saved calculations for context

### 📊 Database Schema:
```sql
calculator_history (
  id UUID PRIMARY KEY,
  user_id UUID (references auth.users),
  calculator_type TEXT ('cash_flow', 'break_even', 'business_budget'),
  calculation_name TEXT,
  calculation_data JSONB,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### 🔒 Security:
- Row Level Security (RLS) enabled
- Users can only access their own calculations
- Automatic user association through Supabase Auth

## Next Steps

After running the SQL script:

1. Test the Cash Flow Calculator's new History tab
2. Integration for Break-Even Calculator
3. Integration for Business Budget Calculator

## Files Created/Modified:

- `shared/schema.ts` - Added calculator history types
- `client/src/lib/services/calculatorHistory.ts` - Service for database operations
- `client/src/components/calculators/CalculationHistory.tsx` - Reusable history component
- `client/src/components/bizbuilder/CashFlowCalculator.tsx` - Added history tab
- `database/calculator_history_table.sql` - Database creation script