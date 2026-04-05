-- Database Schema for Discord Study Bot Dashboard

CREATE TABLE IF NOT EXISTS guild_configs (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(255) UNIQUE NOT NULL,
    join_to_create_channel VARCHAR(255),
    temp_vc_category VARCHAR(255),
    default_user_limit INT DEFAULT 0,
    auto_delete_empty BOOLEAN DEFAULT TRUE,
    vc_name_template VARCHAR(255) DEFAULT '{username}''s Room',
    
    -- Monthly Roles configuration
    top1_role_id VARCHAR(255),
    top2_role_id VARCHAR(255),
    top3_role_id VARCHAR(255),
    top10_role_id VARCHAR(255),
    announcement_channel_id VARCHAR(255),

    -- Bot Configuration
    bot_command_channel_id VARCHAR(255),

    -- Feature Flags
    is_vc_control_enabled BOOLEAN DEFAULT TRUE,
    is_pomodoro_enabled BOOLEAN DEFAULT TRUE,
    is_leveling_enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS study_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    join_time TIMESTAMP WITH TIME ZONE NOT NULL,
    leave_time TIMESTAMP WITH TIME ZONE,
    duration INT DEFAULT 0 -- Duration in seconds
);

CREATE TABLE IF NOT EXISTS study_streaks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_study_date DATE,
    UNIQUE(user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS temp_voice_channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_leaderboards (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    rank INT NOT NULL,
    total_hours NUMERIC(10, 2) DEFAULT 0,
    month INT NOT NULL,
    year INT NOT NULL,
    UNIQUE(guild_id, user_id, month, year)
);

CREATE TABLE IF NOT EXISTS user_levels (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    total_xp INT DEFAULT 0,
    level INT DEFAULT 0,
    total_study_hours NUMERIC(10, 2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS study_role_rewards (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    required_hours NUMERIC(10, 2) NOT NULL,
    role_id VARCHAR(255) NOT NULL,
    UNIQUE(guild_id, required_hours)
);

-- ─── Pomodoro System ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pomodoro_configs (
    id                SERIAL PRIMARY KEY,
    guild_id          VARCHAR(255) NOT NULL,
    voice_channel_id  VARCHAR(255) NOT NULL,     -- triggers session on user join
    text_channel_id   VARCHAR(255) NOT NULL,     -- where the panel embed is posted
    focus_duration    INT     DEFAULT 50,        -- minutes
    break_duration    INT     DEFAULT 10,        -- minutes
    cycles            INT     DEFAULT 4,         -- 0 = infinite
    auto_start        BOOLEAN DEFAULT TRUE,      -- start when user joins
    auto_stop         BOOLEAN DEFAULT TRUE,      -- stop when VC empty
    UNIQUE(guild_id, voice_channel_id)
);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id               SERIAL PRIMARY KEY,
    guild_id         VARCHAR(255) NOT NULL,
    voice_channel_id VARCHAR(255) NOT NULL,
    text_channel_id  VARCHAR(255) NOT NULL,
    message_id       VARCHAR(255),               -- Discord message to edit
    phase            VARCHAR(20)  DEFAULT 'focus', -- focus | break | paused | stopped
    phase_end_time   TIMESTAMPTZ,                -- when current phase ends
    paused_remaining INT,                        -- seconds left when paused
    current_cycle    INT DEFAULT 1,
    total_cycles     INT DEFAULT 4,
    is_active        BOOLEAN DEFAULT TRUE,
    started_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guild_id, voice_channel_id)
);
