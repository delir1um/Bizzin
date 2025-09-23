// Grace Period Scheduler - Automatic processing of expired grace periods
import { GracePeriodService } from './GracePeriodService.js';

export class GracePeriodScheduler {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  // Start the grace period scheduler (runs every hour)
  static start() {
    if (this.isRunning) {
      console.log('⚠️ Grace Period Scheduler is already running');
      return;
    }

    console.log('🚀 Starting Grace Period Scheduler...');
    
    // Process immediately on startup (but only in production)
    if (process.env.NODE_ENV === 'production') {
      this.processExpiredGracePeriods();
    } else {
      console.log('⚠️ Development mode: Skipping initial grace period processing');
    }
    
    // Schedule to run every hour
    this.intervalId = setInterval(() => {
      this.processExpiredGracePeriods();
    }, 60 * 60 * 1000); // 1 hour

    this.isRunning = true;
    console.log('✅ Grace Period Scheduler started - running every hour');
  }

  // Stop the grace period scheduler
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Grace Period Scheduler stopped');
  }

  // Manual processing trigger (can be called from API)
  static async processExpiredGracePeriods(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      console.log(`🔍 [${timestamp}] Processing expired grace periods...`);

      const result = await GracePeriodService.processExpiredGracePeriods();

      if (result.success) {
        if (result.suspended > 0) {
          console.log(`⛔ [${timestamp}] Suspended ${result.suspended} accounts with expired grace periods`);
        } else {
          console.log(`✅ [${timestamp}] No expired grace periods found`);
        }
      } else {
        console.error(`❌ [${timestamp}] Grace period processing completed with errors:`, result.errors);
      }

      // Log summary
      console.log(`📊 [${timestamp}] Grace period processing summary:`, {
        processed: result.processed,
        suspended: result.suspended,
        errors: result.errors.length
      });

    } catch (error) {
      console.error('🚨 Error in grace period scheduler:', error);
    }
  }

  // Get scheduler status
  static getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.intervalId !== null,
      nextRun: this.isRunning ? 'Every hour' : 'Not scheduled'
    };
  }

  // Process grace periods for a specific time (for testing)
  static async processForTime(targetTime: Date): Promise<void> {
    console.log(`🧪 Testing grace period processing for time: ${targetTime.toISOString()}`);
    
    try {
      // This would require modifying the GracePeriodService to accept a target time
      // For now, just run the normal processing
      await this.processExpiredGracePeriods();
    } catch (error) {
      console.error('Error in test grace period processing:', error);
    }
  }
}