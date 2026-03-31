import os
import math
import asyncio
from datetime import datetime, timezone

import discord
from discord.ext import commands
import asyncpg
import socketio
from dotenv import load_dotenv

import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from pomodoro import PomodoroManager

# ─── Config ────────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

TOKEN   = os.getenv('DISCORD_TOKEN')
DB_URL  = os.getenv('DATABASE_URL')
API_URL = os.getenv('VITE_API_URL', 'http://localhost:3000')

# ─── Bot Setup ─────────────────────────────────────────────────────────────────
intents = discord.Intents.default()
intents.voice_states = True
intents.guilds = True

bot  = commands.Bot(command_prefix='!', intents=intents)
sio  = socketio.AsyncClient(reconnection=True, reconnection_attempts=0, reconnection_delay=5)
pool = None
pomo = None   # PomodoroManager — initialized in on_ready

# ─── Database ──────────────────────────────────────────────────────────────────
async def init_db():
    global pool
    pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10)
    print('Database pool created.')

# ─── Socket.IO ─────────────────────────────────────────────────────────────────
@sio.event
async def connect():
    print('Connected to Socket.IO backend.')

@sio.event
async def disconnect():
    print('Disconnected from Socket.IO backend.')

async def safe_emit(event: str, data: dict):
    """Emit a Socket.IO event only if the client is connected."""
    if sio.connected:
        try:
            await sio.emit(event, data)
        except Exception as e:
            print(f'Socket emit error ({event}): {e}')

# ─── Monthly Role Assignment (triggered by backend scheduler) ──────────────────
@sio.event
async def process_monthly_roles(data: dict):
    guild_id = int(data['guildId'])
    guild    = bot.get_guild(guild_id)
    if not guild:
        return

    print(f'Processing monthly roles for: {guild.name}')
    async with pool.acquire() as conn:
        config = await conn.fetchrow(
            'SELECT * FROM guild_configs WHERE guild_id = $1', str(guild_id)
        )
        if not config:
            return

        leaders = await conn.fetch(
            '''
            SELECT user_id, rank, total_hours
            FROM monthly_leaderboards
            WHERE guild_id = $1 AND month = $2 AND year = $3
            ORDER BY rank ASC
            ''',
            str(guild_id), data['month'], data['year']
        )

        rank_roles = {
            1: config['top1_role_id'],
            2: config['top2_role_id'],
            3: config['top3_role_id'],
        }

        # Strip old roles from last month's winners
        prev_month = data['month'] - 1 if data['month'] > 1 else 12
        prev_year  = data['year'] if data['month'] > 1 else data['year'] - 1
        old_leaders = await conn.fetch(
            'SELECT user_id FROM monthly_leaderboards WHERE guild_id = $1 AND month = $2 AND year = $3',
            str(guild_id), prev_month, prev_year
        )

        all_reward_role_ids = [r for r in rank_roles.values() if r] + ([config['top10_role_id']] if config['top10_role_id'] else [])
        for role_id in all_reward_role_ids:
            role = guild.get_role(int(role_id))
            if not role:
                continue
            for row in old_leaders:
                member = guild.get_member(int(row['user_id']))
                if member and role in member.roles:
                    try:
                        await member.remove_roles(role)
                    except discord.HTTPException:
                        pass

        # Assign new roles and build announcement
        medals = {1: '🥇', 2: '🥈', 3: '🥉'}
        announcement_lines = ['⚔️ **Monthly Study Champions!**\n']

        for leader in leaders[:10]:
            rank   = leader['rank']
            member = guild.get_member(int(leader['user_id']))
            if not member:
                continue

            role_id = rank_roles.get(rank) or config['top10_role_id']
            if role_id:
                role = guild.get_role(int(role_id))
                if role:
                    try:
                        await member.add_roles(role)
                    except discord.HTTPException:
                        pass

            if rank <= 3:
                announcement_lines.append(f"{medals[rank]} {member.display_name} — {leader['total_hours']}h")
            else:
                announcement_lines.append(f"{rank}. {member.display_name} — {leader['total_hours']}h")

        announcement_lines.append('\nCongratulations to our top Hunters! 🗡️')

        if config['announcement_channel_id']:
            channel = guild.get_channel(int(config['announcement_channel_id']))
            if channel:
                try:
                    await channel.send('\n'.join(announcement_lines))
                except discord.HTTPException as e:
                    print(f'Failed to send monthly announcement: {e}')

# ─── Events ────────────────────────────────────────────────────────────────────
@bot.event
async def on_ready():
    global pomo
    print(f'Bot logged in as {bot.user} (ID: {bot.user.id})')
    await init_db()
    pomo = PomodoroManager(bot, pool)
    try:
        await sio.connect(API_URL)
    except Exception as e:
        print(f'Initial Socket.IO connection failed: {e}. Will continue without real-time.')

@bot.event
async def on_voice_state_update(member: discord.Member, before: discord.VoiceState, after: discord.VoiceState):
    if member.bot:
        return

    guild_id = str(member.guild.id)

    # ── Pomodoro hooks ───────────────────────────────────────────────────────
    if pomo:
        if after.channel and (not before.channel or before.channel.id != after.channel.id):
            await pomo.on_member_join_vc(member, after.channel)
        if before.channel and (not after.channel or before.channel.id != after.channel.id):
            await pomo.on_member_leave_vc(member, before.channel)
    async with pool.acquire() as conn:
        config = await conn.fetchrow(
            'SELECT * FROM guild_configs WHERE guild_id = $1', guild_id
        )
        if not config:
            return

        # ── Join-to-Create ───────────────────────────────────────────────────
        join_channel = config['join_to_create_channel']
        if after.channel and str(after.channel.id) == join_channel:
            category_id = config['temp_vc_category']
            category    = member.guild.get_channel(int(category_id)) if category_id else None
            template    = config['vc_name_template'] or "{username}'s Dungeon"
            vc_name     = template.replace('{username}', member.display_name)

            try:
                new_vc = await member.guild.create_voice_channel(
                    name=vc_name,
                    category=category,
                    user_limit=config['default_user_limit'] or 0,
                )
                await member.move_to(new_vc)
                await conn.execute(
                    'INSERT INTO temp_voice_channels (channel_id, guild_id, owner_id) VALUES ($1, $2, $3)',
                    str(new_vc.id), guild_id, str(member.id)
                )
                await safe_emit('vc_created', {
                    'guildId': guild_id,
                    'channelId': str(new_vc.id),
                    'owner': member.display_name,
                })
            except discord.HTTPException as e:
                print(f'Failed to create temp VC: {e}')

        # ── Session Close (leaving a channel) ───────────────────────────────
        if before.channel:
            leave_time = datetime.now(timezone.utc)
            session = await conn.fetchrow(
                '''
                SELECT id, join_time FROM study_sessions
                WHERE user_id = $1 AND guild_id = $2 AND channel_id = $3 AND leave_time IS NULL
                ''',
                str(member.id), guild_id, str(before.channel.id)
            )

            if session:
                duration    = int((leave_time - session['join_time']).total_seconds())
                minutes     = duration // 60
                xp_gained   = minutes * 10
                hours_gained = duration / 3600.0

                await conn.execute(
                    'UPDATE study_sessions SET leave_time = $1, duration = $2 WHERE id = $3',
                    leave_time, duration, session['id']
                )

                if xp_gained > 0:
                    await _process_xp(conn, member, guild_id, xp_gained, hours_gained, config)

            # ── Auto-delete empty temp VCs ───────────────────────────────────
            if config['auto_delete_empty'] and len(before.channel.members) == 0:
                is_temp = await conn.fetchrow(
                    'SELECT 1 FROM temp_voice_channels WHERE channel_id = $1', str(before.channel.id)
                )
                if is_temp:
                    try:
                        await before.channel.delete()
                        await conn.execute(
                            'DELETE FROM temp_voice_channels WHERE channel_id = $1', str(before.channel.id)
                        )
                        await safe_emit('vc_deleted', {
                            'guildId': guild_id,
                            'channelId': str(before.channel.id),
                        })
                    except discord.HTTPException as e:
                        print(f'Failed to delete temp VC: {e}')

        # ── Session Open (joining a temp channel) ────────────────────────────
        if after.channel:
            is_temp = await conn.fetchrow(
                'SELECT 1 FROM temp_voice_channels WHERE channel_id = $1', str(after.channel.id)
            )
            if is_temp:
                await conn.execute(
                    'INSERT INTO study_sessions (user_id, guild_id, channel_id, join_time) VALUES ($1, $2, $3, $4)',
                    str(member.id), guild_id, str(after.channel.id), datetime.now(timezone.utc)
                )

# ─── XP & Reward Logic ─────────────────────────────────────────────────────────
async def _process_xp(conn, member: discord.Member, guild_id: str, xp_gained: int, hours_gained: float, config):
    """Update XP, check for level-ups, and assign role rewards."""
    row = await conn.fetchrow(
        '''
        INSERT INTO user_levels (user_id, guild_id, total_xp, total_study_hours)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, guild_id) DO UPDATE
            SET total_xp          = user_levels.total_xp + EXCLUDED.total_xp,
                total_study_hours = user_levels.total_study_hours + EXCLUDED.total_study_hours,
                last_updated      = CURRENT_TIMESTAMP
        RETURNING total_xp, total_study_hours, level
        ''',
        str(member.id), guild_id, xp_gained, hours_gained
    )

    total_xp    = row['total_xp']
    total_hours = float(row['total_study_hours'])
    old_level   = row['level']
    new_level   = int(math.sqrt(total_xp / 100))

    # Level-up
    if new_level > old_level:
        await conn.execute(
            'UPDATE user_levels SET level = $1 WHERE user_id = $2 AND guild_id = $3',
            new_level, str(member.id), guild_id
        )
        await safe_emit('user_level_up', {
            'guildId': guild_id,
            'userId': str(member.id),
            'level': new_level,
            'xp': total_xp,
        })

    # Role rewards
    rewards = await conn.fetch(
        '''
        SELECT required_hours, role_id FROM study_role_rewards
        WHERE guild_id = $1 AND required_hours <= $2
        ORDER BY required_hours DESC
        ''',
        guild_id, total_hours
    )

    for reward in rewards:
        role = member.guild.get_role(int(reward['role_id']))
        if role and role not in member.roles:
            try:
                await member.add_roles(role)
                await safe_emit('role_reward_earned', {
                    'guildId': guild_id,
                    'userId': str(member.id),
                    'roleId': str(role.id),
                    'hours': float(reward['required_hours']),
                })
                if config['announcement_channel_id']:
                    channel = member.guild.get_channel(int(config['announcement_channel_id']))
                    if channel:
                        await channel.send(
                            f'⚔️ **System Notification** | Hunter **{member.display_name}** reached '
                            f'`{float(reward["required_hours"])}h` and earned {role.mention}!'
                        )
            except discord.HTTPException as e:
                print(f'Failed to assign role reward {role.name}: {e}')

# ─── Render Health Check Server ────────────────────────────────────────────────
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Bot is alive")
    def log_message(self, format, *args):
        return # Silence logs

def run_health_check():
    port = int(os.getenv("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    print(f"Health check server running on port {port}")
    server.serve_forever()

# ─── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    # Start health check server in a background thread for Render Free Tier
    threading.Thread(target=run_health_check, daemon=True).start()
    bot.run(TOKEN)
