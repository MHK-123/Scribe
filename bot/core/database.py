import asyncio
import asyncpg
from bot.utils.logger import bot_logger
from bot.config import DATABASE_URL, Settings

pool = None

async def init_db():
    """
    Initializes the asyncpg connection pool with exponential backoff retry logic.
    """
    global pool
    retries = 5
    delay = 2

    for attempt in range(retries):
        try:
            bot_logger.info(f"Attempting to connect to the database (Attempt {attempt + 1}/{retries})...")
            # ─── Connection Node: Absolute Wait Threshold (10s) ───────────────────
            pool = await asyncio.wait_for(
                asyncpg.create_pool(
                    DATABASE_URL, 
                    min_size=Settings.MIN_DB_POOL, 
                    max_size=Settings.MAX_DB_POOL,
                    command_timeout=60
                ),
                timeout=10.0
            )
            bot_logger.info("⚔️ [STATUS]: Database Manifested.")
            return pool
        except asyncio.TimeoutError:
            bot_logger.error(f"❌ [STATUS]: Database Connection Timed Out (10s) on Attempt {attempt + 1}.")
            if attempt < retries - 1:
                await asyncio.sleep(delay)
                delay *= 2
            else:
                raise
        except Exception as e:
            bot_logger.error(f"Database connection failed: {e}")
            if attempt < retries - 1:
                bot_logger.warning(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                bot_logger.critical("Failed to connect to the database after all retries. The bot may crash or lose functionality.")
                raise e

async def reconcile_schema(pool):
    """
    Surgical Schema Ritual: Automatically aligns the database with the Sentinel's needs.
    """
    bot_logger.info("📡 [RECONCILE]: Manifesting database schema alignment...")
    async with pool.acquire() as conn:
        # 1. Ensure user_levels has exact columns
        # Handle Rename from guide.md (xp -> total_xp, study_seconds -> total_study_hours)
        await conn.execute('''
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_levels' AND column_name='xp') THEN
                    ALTER TABLE user_levels RENAME COLUMN xp TO total_xp;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_levels' AND column_name='study_seconds') THEN
                    -- Note: Since seconds are vastly different than hours, we add a new column and let the old one stay for history
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_levels' AND column_name='total_study_hours') THEN
                        ALTER TABLE user_levels ADD COLUMN total_study_hours DOUBLE PRECISION DEFAULT 0;
                        UPDATE user_levels SET total_study_hours = study_seconds / 3600.0;
                    END IF;
                END IF;
            END $$;
        ''')

        # 2. Manifest required tables
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS guild_configs (
                guild_id TEXT PRIMARY KEY,
                owner_id TEXT,
                join_to_create_channel TEXT,
                temp_vc_category TEXT,
                default_user_limit INTEGER DEFAULT 0,
                auto_delete_empty BOOLEAN DEFAULT TRUE,
                vc_name_template TEXT DEFAULT '{username}''s Room',
                top1_role_id TEXT, top2_role_id TEXT, top3_role_id TEXT, top10_role_id TEXT,
                reset_timezone TEXT DEFAULT 'Asia/Kolkata',
                last_reset_month TEXT,
                bot_command_channel_id TEXT,
                announcement_channel_id TEXT
            );

            CREATE TABLE IF NOT EXISTS user_levels (
                user_id TEXT,
                guild_id TEXT,
                total_xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 0,
                total_study_hours DOUBLE PRECISION DEFAULT 0,
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (user_id, guild_id)
            );

            CREATE TABLE IF NOT EXISTS study_sessions (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                guild_id TEXT,
                channel_id TEXT,
                join_time TIMESTAMPTZ NOT NULL,
                leave_time TIMESTAMPTZ,
                duration INTEGER
            );

            CREATE TABLE IF NOT EXISTS monthly_leaderboards (
                guild_id TEXT,
                user_id TEXT,
                rank INTEGER,
                total_hours DOUBLE PRECISION,
                month INTEGER,
                year INTEGER,
                PRIMARY KEY (guild_id, user_id, month, year)
            );

            CREATE TABLE IF NOT EXISTS pomodoro_configs (
                guild_id TEXT PRIMARY KEY,
                focus_duration INTEGER DEFAULT 25,
                break_duration INTEGER DEFAULT 5,
                auto_start BOOLEAN DEFAULT TRUE,
                auto_stop BOOLEAN DEFAULT TRUE
            );

            CREATE TABLE IF NOT EXISTS study_role_rewards (
                id SERIAL PRIMARY KEY,
                guild_id TEXT,
                required_hours DOUBLE PRECISION,
                role_id TEXT,
                UNIQUE(guild_id, required_hours)
            );
        ''')

        # 3. Purge Ghost Sessions to allow Unique Index Creation
        await conn.execute('''
            UPDATE study_sessions 
            SET leave_time = CURRENT_TIMESTAMP, duration = 0 
            WHERE leave_time IS NULL 
              AND id NOT IN (
                  SELECT MAX(id) FROM study_sessions 
                  WHERE leave_time IS NULL 
                  GROUP BY user_id, guild_id, channel_id
              );
        ''')

        # 4. Apply Partial Unique Index for Session Safety
        await conn.execute('''
            CREATE UNIQUE INDEX IF NOT EXISTS idx_active_study_session 
            ON study_sessions (user_id, guild_id, channel_id) 
            WHERE leave_time IS NULL;
        ''')
        
    bot_logger.info("✅ [RECONCILE]: Schema manifestation complete.")

def get_pool():
    if not pool:
        bot_logger.warning("get_pool called before pool was initialized!")
    return pool
