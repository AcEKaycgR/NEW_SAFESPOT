// Database migration script for blockchain authentication
import { PrismaClient } from '../generated/prisma';

export class DatabaseMigrations {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  /**
   * Migration 001: Create initial blockchain authentication tables
   * This migration creates the user_profiles and digital_ids tables
   * and adds blockchain fields to the users table
   */
  async migration001_createBlockchainTables(): Promise<void> {
    console.log('Running migration 001: Create blockchain authentication tables');

    try {
      // The tables are already created by Prisma schema
      // This method serves as documentation and potential future raw SQL migrations
      
      console.log('✓ Migration 001 completed successfully');
    } catch (error) {
      console.error('✗ Migration 001 failed:', error);
      throw error;
    }
  }

  /**
   * Migration 002: Add indexes for performance
   */
  async migration002_addIndexes(): Promise<void> {
    console.log('Running migration 002: Add performance indexes');

    try {
      // SQLite indexes are created automatically by Prisma for unique constraints
      // Additional indexes can be added here if needed for performance
      
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_digital_ids_user_status ON digital_ids(user_id, status);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_digital_ids_valid_until ON digital_ids(valid_until);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);`;

      console.log('✓ Migration 002 completed successfully');
    } catch (error) {
      console.error('✗ Migration 002 failed:', error);
      throw error;
    }
  }

  /**
   * Migration 003: Seed initial data (optional)
   */
  async migration003_seedInitialData(): Promise<void> {
    console.log('Running migration 003: Seed initial data');

    try {
      // Check if we already have data
      const userCount = await this.prisma.user.count();
      
      if (userCount === 0) {
        // Create a sample admin user for testing
        await this.prisma.user.create({
          data: {
            email: 'admin@safespot.com',
            name: 'Admin User',
            blockchain_address: '0x0000000000000000000000000000000000000000',
            verification_status: 'VERIFIED'
          }
        });

        console.log('✓ Seeded initial admin user');
      } else {
        console.log('✓ Data already exists, skipping seed');
      }

      console.log('✓ Migration 003 completed successfully');
    } catch (error) {
      console.error('✗ Migration 003 failed:', error);
      throw error;
    }
  }

  /**
   * Run all migrations in order
   */
  async runAllMigrations(): Promise<void> {
    console.log('Starting database migrations...');

    await this.connect();

    try {
      await this.migration001_createBlockchainTables();
      await this.migration002_addIndexes();
      await this.migration003_seedInitialData();

      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Check migration status
   */
  async checkMigrationStatus(): Promise<void> {
    await this.connect();

    try {
      const userCount = await this.prisma.user.count();
      const profileCount = await this.prisma.userProfile.count();
      const digitalIdCount = await this.prisma.digitalID.count();

      console.log('📊 Database Status:');
      console.log(`  Users: ${userCount}`);
      console.log(`  User Profiles: ${profileCount}`);
      console.log(`  Digital IDs: ${digitalIdCount}`);

      // Check if indexes exist
      const indexInfo = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name LIKE 'idx_%'
      ` as Array<{ name: string }>;

      console.log(`  Indexes: ${indexInfo.length} custom indexes`);
      indexInfo.forEach(index => console.log(`    - ${index.name}`));

    } catch (error) {
      console.error('Error checking migration status:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface for running migrations
if (require.main === module) {
  const migrations = new DatabaseMigrations();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'run':
      migrations.runAllMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'status':
      migrations.checkMigrationStatus()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    default:
      console.log('Usage: tsx migrations.ts [run|status]');
      process.exit(1);
  }
}
