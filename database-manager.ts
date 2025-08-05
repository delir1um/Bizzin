import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class DatabaseManager {
  async executeSQL(sql: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('SQL execution error:', error);
        return { success: false, error: error.message };
      }
      return data;
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: error.message };
    }
  }

  async querySQL(sql: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('query_sql', { sql_query: sql });
      if (error) {
        console.error('SQL query error:', error);
        return { success: false, error: error.message };
      }
      return data;
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: error.message };
    }
  }

  async listTables(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

      if (error) {
        console.error('Error listing tables:', error);
        return [];
      }

      return data.map(row => row.table_name);
    } catch (error) {
      console.error('Unexpected error listing tables:', error);
      return [];
    }
  }

  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      return !error;
    } catch (error) {
      return false;
    }
  }

  async getTableInfo(tableName: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (error) {
        console.error(`Error getting info for table ${tableName}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error:', error);
      return null;
    }
  }

  async createUserProfile(userId: string, email: string, profileData: any = {}): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          email: email,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error creating user profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: error.message };
    }
  }

  async createAdminUser(userId: string, email: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          user_id: userId,
          email: email,
          is_admin: true,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error creating admin user:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: error.message };
    }
  }

  async checkDatabaseHealth(): Promise<any> {
    const health = {
      tables: {},
      functions: [],
      policies: {},
      overall: 'unknown'
    };

    try {
      // Check essential tables
      const essentialTables = [
        'admin_users', 
        'user_profiles', 
        'user_plans', 
        'usage_limits',
        'journal_entries',
        'goals',
        'documents',
        'podcast_episodes',
        'podcast_progress'
      ];

      for (const table of essentialTables) {
        const exists = await this.checkTableExists(table);
        health.tables[table] = exists ? 'exists' : 'missing';
      }

      // Check for RPC functions
      try {
        await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
        health.functions.push('exec_sql');
      } catch (error) {
        console.log('exec_sql function not available');
      }

      // Determine overall health
      const missingTables = Object.values(health.tables).filter(status => status === 'missing').length;
      const totalTables = Object.keys(health.tables).length;

      if (missingTables === 0 && health.functions.length > 0) {
        health.overall = 'healthy';
      } else if (missingTables < totalTables / 2) {
        health.overall = 'warning';
      } else {
        health.overall = 'error';
      }

      return health;
    } catch (error) {
      console.error('Health check failed:', error);
      health.overall = 'error';
      return health;
    }
  }
}

// Create and export a singleton instance
export const dbManager = new DatabaseManager();

// CLI interface for testing
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔧 Database Manager CLI');
  console.log('Connected to:', supabaseUrl);

  switch (command) {
    case 'health':
      console.log('\n🏥 Checking database health...');
      const health = await dbManager.checkDatabaseHealth();
      console.log('\n📊 Health Report:');
      console.log('Overall Status:', health.overall);
      console.log('\n📋 Tables:');
      Object.entries(health.tables).forEach(([table, status]) => {
        const icon = status === 'exists' ? '✅' : '❌';
        console.log(`${icon} ${table}: ${status}`);
      });
      console.log('\n🔧 Functions:', health.functions.length > 0 ? health.functions.join(', ') : 'None available');
      break;

    case 'tables':
      console.log('\n📋 Listing tables...');
      const tables = await dbManager.listTables();
      if (tables.length > 0) {
        tables.forEach((table, index) => {
          console.log(`${index + 1}. ${table}`);
        });
      } else {
        console.log('No tables found or unable to access');
      }
      break;

    case 'table-info':
      const tableName = args[1];
      if (!tableName) {
        console.log('Usage: tsx database-manager.ts table-info <table_name>');
        break;
      }
      console.log(`\n📊 Table info for: ${tableName}`);
      const info = await dbManager.getTableInfo(tableName);
      if (info && info.length > 0) {
        info.forEach(col => {
          console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      } else {
        console.log('Table not found or no access');
      }
      break;

    case 'sql':
      const sqlQuery = args[1];
      if (!sqlQuery) {
        console.log('Usage: tsx database-manager.ts sql "SELECT * FROM table_name LIMIT 5"');
        break;
      }
      console.log('\n🔍 Executing SQL...');
      const result = await dbManager.executeSQL(sqlQuery);
      console.log('Result:', JSON.stringify(result, null, 2));
      break;

    default:
      console.log('\nAvailable commands:');
      console.log('- health: Check database health');
      console.log('- tables: List all tables');
      console.log('- table-info <name>: Get table column info');
      console.log('- sql "query": Execute SQL query');
      break;
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}