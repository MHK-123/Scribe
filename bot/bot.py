import os
import math
import asyncio
from datetime import datetime, timezone

import discord
from discord.ext import commands
from discord import app_commands
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
intents = discord.Intents.all()

# ─── Custom Help Command ──────────────────────────────────────────────────────────
class DungeonHelp(commands.HelpCommand):
    def __init__(self):
        super().__init__(command_attrs={'help': 'Shows the System Interface guide.'})

    async def send_bot_help(self, mapping):
        embed = discord.Embed(
            title="🛡️ CORE SANCTUM · SYSTEM HELP",
            description=(
                "```ansi\n"
                "\u001b[1;36m        SANCTUM SYSTEM INTERFACE\u001b[0m\n"
                "\u001b[1;30m    ⚔️  ALL CONTROL NODES ACTIVE\u001b[0m\n"
                "```\n"
                "Welcome, Hunter. Use the commands below to navigate the Sanctum."
            ),
            color=THEME_COLOR,
            timestamp=datetime.now(timezone.utc)
        )

        # 1. HUNTER OPERATIONS (Slash Commands)
        val_hunter = (
            "• `/hunter-rank` - View your stats & XP\n"
            "• `/leaderboard` - Global Hunter rankings\n"
            "• `/pomo-setup` - Configure Scribe Engine for a VC\n"
        )
        embed.add_field(name="🏹 HUNTER OPERATIONS", value=val_hunter, inline=False)

        # 2. SCRIBE ENGINE (Auto Events)
        val_scribe = (
            "• **Join Configured VC**: Triggers Scribe HUD\n"
            "• **VC Stay**: Accumulate XP & Level Up\n"
            "• **VC Empty**: Scribe HUD auto-archives\n"
        )
        embed.add_field(name="⌛ SCRIBE ENGINE", value=val_scribe, inline=False)

        # 3. ADMIN NODES (Prefix Commands)
        val_admin = (
            "• `.sync` - Global command propagation\n"
            "• `.sync-guild` - Immediate guild sync\n"
            "• `.help [cmd]` - Detailed node info\n"
        )
        embed.add_field(name="🛡️ ADMIN NODES", value=val_admin, inline=False)
        
        embed.set_footer(text="CORE SYSTEM • ACCESS LEVEL: HUNTER+")
        
        await self.get_destination().send(embed=embed)

bot  = commands.Bot(command_prefix='.', intents=intents, help_command=DungeonHelp()) 
bot.api_url = API_URL # Expose for modules
sio  = socketio.AsyncClient(reconnection=True, reconnection_attempts=0, reconnection_delay=5)
pool = None
pomo = None   # PomodoroManager — initialized in on_ready

# ─── Theme Config ──────────────────────────────────────────────────────────────
THEME_COLOR = 0x4b8bf5  # Blue glow
ERROR_COLOR = 0xef4444  # Red glow
SUCCESS_COLOR = 0x10b981 # Green glow

def create_dungeon_embed(title: str, description: str = None, color: int = THEME_COLOR):
    embed = discord.Embed(title=title, description=description, color=color)
    embed.set_footer(text="CORE SYSTEM • DUNGEON TRACKER", icon_url=bot.user.avatar.url if bot.user.avatar else None)
    embed.timestamp = datetime.now(timezone.utc)
    return embed

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

# ─── Socket.IO Events ──────────────────────────────────────────────────────────
@sio.event
async def request_guild_sync(data: dict):
    """Provide backend with live member counts and guild info."""
    print('Backend requested guild sync.')
    guilds_data = []
    for guild in bot.guilds:
        guilds_data.append({
            'id': str(guild.id),
            'name': guild.name,
            'memberCount': guild.member_count,
            'icon': guild.icon.url if guild.icon else None,
            'activeVCCount': len([vc for vc in guild.voice_channels if len(vc.members) > 0])
        })
    await safe_emit('guild_sync_response', {'guilds': guilds_data})

@sio.event
async def guild_monthly_reset(data: dict):
    """Remove study-related rewards from a specific guild's members."""
    guild_id = int(data['guildId'])
    guild = bot.get_guild(guild_id)
    if not guild:
        return

    print(f'⚔️  SYSTEM: MONTHLY RESET INITIATED FOR {guild.name}')
    async with pool.acquire() as conn:
        rewards = await conn.fetch('SELECT role_id FROM study_role_rewards WHERE guild_id = $1', str(guild_id))
        config = await conn.fetchrow('SELECT * FROM guild_configs WHERE guild_id = $1', str(guild_id))

    role_ids = [int(r['role_id']) for r in rewards]
    if config:
        # Add rank-specific roles from config if they exist
        for k in ['top1_role_id', 'top2_role_id', 'top3_role_id', 'top10_role_id']:
            if config[k]: role_ids.append(int(config[k]))

    roles_to_strip = [guild.get_role(rid) for rid in set(role_ids) if guild.get_role(rid)]
    if not roles_to_strip:
        return

    print(f'[Reset] Stripping {len(roles_to_strip)} role types from Hunters in {guild.name}')
    for member in guild.members:
        if member.bot: continue
        member_roles_to_remove = [r for r in roles_to_strip if r in member.roles]
        if member_roles_to_remove:
            try:
                await member.remove_roles(*member_roles_to_remove, reason="Guild Monthly Reset")
            except discord.HTTPException:
                pass
    print(f'⚔️  SYSTEM: RESET COMPLETE FOR {guild.name}')

# ─── Events ────────────────────────────────────────────────────────────────────
@bot.event
async def on_ready():
    global pomo
    # Set System Activity
    activity = discord.Activity(
        type=discord.ActivityType.watching,
        name="/pomo-setup | .help"
    )
    await bot.change_presence(activity=activity)

    print(f'Bot logged in as {bot.user} (ID: {bot.user.id})')
    await init_db()
    pomo = PomodoroManager(bot, pool)
    await pomo.load_active_sessions()
    
    # Sync Slash Commands
    try:
        print("⚡ Syncing global slash commands...")
        synced = await bot.tree.sync()
        print(f"✅ Successfully synced {len(synced)} global slash commands.")
    except Exception as e:
        print(f"❌ Global slash command sync failed: {e}")

    try:
        await sio.connect(API_URL)
    except Exception as e:
        print(f'Initial Socket.IO connection failed: {e}. Will continue without real-time.')

@bot.event
async def on_message(message):
    if message.author.bot:
        return
    await bot.process_commands(message)

# ─── Administrative Nodes ───────────────────────────────────────────────────

@bot.command(name='sync')
@commands.is_owner()
async def sync_global(ctx):
    """[Owner Only] Sync slash commands globally."""
    try:
        print(f"Admin {ctx.author} triggered global sync.")
        synced = await bot.tree.sync()
        embed = create_dungeon_embed(
            "⚡ GLOBAL SYNC COMPLETE",
            f"Successfully propagated `{len(synced)}` command nodes to the global network.",
            SUCCESS_COLOR
        )
        await ctx.send(embed=embed)
    except Exception as e:
        await ctx.send(f"❌ Core Sync Error: {e}")

@bot.command(name='sync-guild')
@commands.has_permissions(administrator=True)
async def sync_guild_command(ctx):
    """[Admin Only] Force sync commands to this guild."""
    try:
        print(f"Admin {ctx.author} triggered guild sync for {ctx.guild.id}.")
        bot.tree.copy_global_to(guild=ctx.guild)
        synced = await bot.tree.sync(guild=ctx.guild)
        embed = create_dungeon_embed(
            "⚡ GUILD SYNC COMPLETE",
            f"Successfully updated `{len(synced)}` local command nodes for this realm.",
            SUCCESS_COLOR
        )
        await ctx.send(embed=embed)
    except Exception as e:
        await ctx.send(f"❌ Guild Sync Error: {e}")

@sync_global.error
@sync_guild_command.error
async def command_error_handler(ctx, error):
    if isinstance(error, (commands.NotOwner, commands.MissingPermissions)):
        embed = create_dungeon_embed(
            "🛡️ SYSTEM ALERT: ACCESS DENIED",
            "```ansi\n\u001b[1;31mFAILED: Insufficient Mana / Permissions\u001b[0m\n```\n"
            "You lack the authority to recalibrate the Sanctum's nodes.",
            ERROR_COLOR
        )
        await ctx.send(embed=embed)

@bot.command(name='l')
async def leaderboard_cmd(ctx):
    """View the Hunter leaderboard."""
    await show_leaderboard(ctx)

@bot.command(name='m')
async def profile_cmd(ctx):
    """View your Hunter stats."""
    await show_profile(ctx)

async def show_leaderboard(message):
    guild_id = str(message.guild.id)
    async with pool.acquire() as conn:
        top_hunters = await conn.fetch(
            '''
            SELECT user_id, total_study_hours, level
            FROM user_levels
            WHERE guild_id = $1
            ORDER BY total_study_hours DESC
            LIMIT 10
            ''',
            guild_id
        )

    embed = create_dungeon_embed("⚔️ RANKING: TOP HUNTERS", "Top users based on VC time.")
    
    if not top_hunters:
        embed.description = "No hunters found in this realm yet."
    else:
        lines = []
        medals = {1: '🥇', 2: '🥈', 3: '🥉'}
        for i, row in enumerate(top_hunters, 1):
            user = message.guild.get_member(int(row['user_id']))
            name = user.display_name if user else f"Unknown Hunter ({row['user_id']})"
            medal = medals.get(i, f"`{i}.`")
            lines.append(f"{medal} **{name}** • Level {row['level']} • `{float(row['total_study_hours']):.1f}h`")
        embed.description = "\n".join(lines)

    await message.channel.send(embed=embed)

async def show_profile(message):
    guild_id = str(message.guild.id)
    user_id = str(message.author.id)
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            'SELECT * FROM user_levels WHERE guild_id = $1 AND user_id = $2',
            guild_id, user_id
        )
    
    if not row:
        await message.channel.send("No stats found for you yet. Start a study session!")
        return

    embed = create_dungeon_embed(f"👤 PLAYER CARD: {message.author.display_name}")
    embed.set_thumbnail(url=message.author.display_url)
    
    embed.add_field(name="✨ LEVEL", value=f"`{row['level']}`", inline=True)
    embed.add_field(name="⏳ TOTAL TIME", value=f"`{float(row['total_study_hours']):.1f}h`", inline=True)
    embed.add_field(name="🔥 TOTAL XP", value=f"`{row['total_xp']}`", inline=True)
    
    # Custom Background (per user req)
    # Using a placeholder dungeon image for the "System Panel" feel
    embed.set_image(url="https://i.imgur.com/3Z6Kx7v.png") # Themed background
    
    await message.channel.send(embed=embed)

# ─── VC Slash Commands ─────────────────────────────────────────────────────────

@bot.tree.command(name="vc-rename", description="Rename your temp voice channel")
@app_commands.describe(name="New name for the channel")
async def vc_rename(interaction: discord.Interaction, name: str):
    if not interaction.user.voice:
        return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
    
    channel = interaction.user.voice.channel
    async with pool.acquire() as conn:
        owner = await conn.fetchval('SELECT owner_id FROM temp_voice_channels WHERE channel_id = $1', str(channel.id))
        
    if not owner or owner != str(interaction.user.id):
        return await interaction.response.send_message("Only the room owner can rename this dungeon!", ephemeral=True)

    await channel.edit(name=name)
    await interaction.response.send_message(f"✅ Dungeon renamed to **{name}**", ephemeral=True)

@bot.tree.command(name="vc-lock", description="Lock your temp voice channel")
async def vc_lock(interaction: discord.Interaction):
    if not interaction.user.voice:
        return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
    
    channel = interaction.user.voice.channel
    async with pool.acquire() as conn:
        owner = await conn.fetchval('SELECT owner_id FROM temp_voice_channels WHERE channel_id = $1', str(channel.id))
        
    if not owner or owner != str(interaction.user.id):
        return await interaction.response.send_message("Only the room owner can lock this dungeon!", ephemeral=True)

    overwrite = channel.overwrites_for(interaction.guild.default_role)
    overwrite.connect = False
    await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite)
    await interaction.response.send_message("🔓 Dungeon locked. No new hunters can join.", ephemeral=True)

@bot.tree.command(name="vc-unlock", description="Unlock your temp voice channel")
async def vc_unlock(interaction: discord.Interaction):
    if not interaction.user.voice:
        return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
    
    channel = interaction.user.voice.channel
    async with pool.acquire() as conn:
        owner = await conn.fetchval('SELECT owner_id FROM temp_voice_channels WHERE channel_id = $1', str(channel.id))
        
    if not owner or owner != str(interaction.user.id):
        return await interaction.response.send_message("Only the room owner can unlock this dungeon!", ephemeral=True)

    overwrite = channel.overwrites_for(interaction.guild.default_role)
    overwrite.connect = True
    await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite)
    await interaction.response.send_message("🔓 Dungeon unlocked. Hunters may enter freely.", ephemeral=True)

@bot.tree.command(name="vc-limit", description="Set member limit for your temp voice channel")
@app_commands.describe(limit="Member limit (0 to 99)")
async def vc_limit(interaction: discord.Interaction, limit: int):
    if not interaction.user.voice:
        return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
    
    if limit < 0 or limit > 99:
        return await interaction.response.send_message("Limit must be between 0 and 99.", ephemeral=True)

    channel = interaction.user.voice.channel
    async with pool.acquire() as conn:
        owner = await conn.fetchval('SELECT owner_id FROM temp_voice_channels WHERE channel_id = $1', str(channel.id))
        
    if not owner or owner != str(interaction.user.id):
        return await interaction.response.send_message("Only the room owner can modify this dungeon!", ephemeral=True)

    await channel.edit(user_limit=limit)
    await interaction.response.send_message(f"✅ Member limit set to **{limit}**.", ephemeral=True)

@bot.tree.command(name="vc-invite", description="Send a styled invite to a hunter in DMs")
@app_commands.describe(member="Member to invite")
async def vc_invite(interaction: discord.Interaction, member: discord.Member):
    if not interaction.user.voice:
        return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
    
    channel = interaction.user.voice.channel
    invite = await channel.create_invite(max_age=3600, max_uses=1)
    
    embed = create_dungeon_embed("⚔️ DUNGEON INVITATION", f"You have been summoned to join **{interaction.user.display_name}**'s party!")
    embed.add_field(name="Channel", value=f"`{channel.name}`", inline=True)
    embed.add_field(name="Link", value=f"[JOIN NOW]({invite.url})", inline=True)
    embed.set_thumbnail(url=interaction.guild.icon.url if interaction.guild.icon else None)
    
    try:
        await member.send(embed=embed)
        await interaction.response.send_message(f"✅ Summon sent to **{member.display_name}**.", ephemeral=True)
    except discord.Forbidden:
        await interaction.response.send_message(f"❌ Could not reach **{member.display_name}**. (DMs closed)", ephemeral=True)

@bot.event
async def on_voice_state_update(member: discord.Member, before: discord.VoiceState, after: discord.VoiceState):
    if member.bot or pool is None:
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
