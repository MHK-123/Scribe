"""
Scribe Pomodoro Engine (Resilient Overhaul)
Dungeon-themed study timer system with Discord embeds + buttons.
"""
import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

import discord
from bot.utils.logger import bot_logger

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _fmt_time(seconds: int) -> str:
    """Format seconds as MM:SS."""
    seconds = max(0, int(seconds))
    m, s = divmod(seconds, 60)
    return f"{m:02d}:{s:02d}"

def _system_bar(elapsed: int, total: int, width: int = 15) -> str:
    """HUD-style thick progress bar using ANSI blocks."""
    ratio = min(elapsed / total, 1.0) if total > 0 else 0
    filled = int(ratio * width)
    empty  = width - filled
    
    # ANSI Cyan for filled, Dark Grey for empty
    bar = f"\u001b[1;36m{'█' * filled}\u001b[0m\u001b[1;30m{'█' * empty}\u001b[0m"
    return f" {bar} "

def _build_embed(session: 'PomodoroSession', member_names: list[str], bot: discord.Client) -> discord.Embed:
    """Build the premium 'SCRIBE SYSTEM' HUD embed."""
    now       = datetime.now(timezone.utc)
    is_focus  = session.phase == 'focus'
    is_paused = session.phase == 'paused'

    if is_paused:
        remaining_sec = session.paused_remaining or 0
    elif session.phase_end:
        remaining_sec = int((session.phase_end - now).total_seconds())
    else:
        remaining_sec = 0

    remaining_sec = max(0, remaining_sec)
    total_sec     = (session.focus_min if is_focus or is_paused else session.break_min) * 60
    elapsed_sec   = max(0, total_sec - remaining_sec)
    
    # Phase config
    if is_focus:
        phase_label  = 'FOCUS MODE'
        phase_color  = 0x4b8bf5   # electric blue
    elif session.phase == 'break':
        phase_label  = 'BREAK MODE'
        phase_color  = 0x7b5cf0   # purple
    else:
        phase_label  = 'SYSTEM PAUSED'
        phase_color  = 0x3a3a5c

    time_str   = _fmt_time(remaining_sec)
    sys_bar    = _system_bar(elapsed_sec, total_sec)

    hunters_count = len(member_names)
    hunters_list  = f"**{hunters_count} Active Hunter{'s' if hunters_count != 1 else ''}**: {', '.join(member_names[:8])}" if member_names else "**No Hunters Active**"

    description = (
        f"```ansi\n"
        f"\u001b[1;37m        SCRIBE SYSTEM\u001b[0m\n"
        f"\u001b[1;30m      {phase_label}\u001b[0m\n"
        f"```\n"
        f"## `{time_str}`\n"
        f"**Status**: {phase_label}\n"
        f"```ansi\n"
        f"{sys_bar}\n"
        f"```\n"
        f"{hunters_list}"
    )

    embed = discord.Embed(
        description=description,
        color=phase_color,
        timestamp=now,
    )
    embed.set_author(name="SCRIBE · FOCUS SYSTEM", icon_url="https://i.imgur.com/MFZnNba.png")
    embed.set_image(url="https://image2url.com/r2/default/images/1775042958395-2815bf82-1b57-406a-87a6-ef0d0a2580c7.png")
    return embed

# ─── Session Data ──────────────────────────────────────────────────────────────

@dataclass
class PomodoroSession:
    guild_id:        int
    vc_id:           int
    text_channel_id: int
    focus_min:       int
    break_min:       int
    auto_stop:       bool      = True

    phase:           str       = 'focus'
    phase_end:       Optional[datetime] = None
    paused_remaining: Optional[int]     = None  # seconds left when paused

    message_id:      Optional[int]      = None
    task:            Optional[asyncio.Task] = field(default=None, repr=False)
    participants:    dict               = field(default_factory=dict)
    session_start:   datetime           = field(default_factory=lambda: datetime.now(timezone.utc))

# ─── Button View ──────────────────────────────────────────────────────────────

class PomodoroView(discord.ui.View):
    def __init__(self, manager: 'PomodoroManager', key: tuple):
        super().__init__(timeout=None)
        self.manager = manager
        self.key     = key

    def _get_session(self) -> Optional[PomodoroSession]:
        return self.manager.sessions.get(self.key)

    @discord.ui.button(label='Join', style=discord.ButtonStyle.success, custom_id='pomo_join')
    async def join_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        session = self._get_session()
        if not session: return await interaction.response.send_message("No active session.", ephemeral=True)
        session.participants[interaction.user.id] = datetime.now(timezone.utc)
        await interaction.response.send_message("You have joined the focus ritual.", ephemeral=True)
        await self.manager._refresh_message(session)

    @discord.ui.button(label='Pause/Resume', style=discord.ButtonStyle.secondary, custom_id='pomo_pause')
    async def pause_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        session = self._get_session()
        if not session: return await interaction.response.send_message("No session.", ephemeral=True)
        
        if session.phase == 'paused':
            session.phase_end = datetime.now(timezone.utc) + timedelta(seconds=session.paused_remaining or 0)
            session.phase     = 'focus' if session.paused_remaining is not None else 'break'
            session.paused_remaining = None
        else:
            now = datetime.now(timezone.utc)
            session.paused_remaining = max(0, int((session.phase_end - now).total_seconds())) if session.phase_end else 0
            session.phase = 'paused'
            
        await self.manager._refresh_message(session)
        await interaction.response.defer()

    @discord.ui.button(label='Stop', style=discord.ButtonStyle.danger, custom_id='pomo_stop')
    async def stop_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.guild_permissions.manage_channels:
            return await interaction.response.send_message("Authority required.", ephemeral=True)
        session = self._get_session()
        if session: await self.manager.stop_session(session, reason="Manual Termination")
        await interaction.response.defer()

# ─── Pomodoro Manager ─────────────────────────────────────────────────────────

class PomodoroManager:
    def __init__(self, bot: discord.Client, pool):
        self.bot      = bot
        self.pool     = pool
        self.sessions: dict[tuple, PomodoroSession] = {}

    async def load_active_sessions(self):
        """Restores sessions from DB with error resilience."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM pomodoro_sessions WHERE is_active = TRUE')
            for row in rows:
                try:
                    guild = self.bot.get_guild(int(row['guild_id']))
                    if not guild: continue
                    vc = guild.get_channel(int(row['voice_channel_id']))
                    if not vc: continue
                    
                    key = (int(row['guild_id']), int(row['voice_channel_id']))
                    participants = {m.id: datetime.now(timezone.utc) for m in vc.members if not m.bot}
                    
                    session = PomodoroSession(
                        guild_id        = int(row['guild_id']),
                        vc_id           = int(row['voice_channel_id']),
                        text_channel_id = int(row['text_channel_id']),
                        focus_min       = 25,
                        break_min       = 5,
                        phase           = row['phase'],
                        phase_end       = row['phase_end_time'],
                        message_id      = int(row['message_id']) if row['message_id'] else None,
                        participants    = participants,
                    )
                    self.sessions[key] = session
                    session.task = asyncio.create_task(self._session_loop(session, key, guild))
                except Exception as e:
                    bot_logger.error(f"Failed to restore session {row['id']}: {e}")

    async def on_member_join_vc(self, member: discord.Member, channel: discord.VoiceChannel):
        """Resilient entry point for auto-ignition."""
        key = (member.guild.id, channel.id)
        
        # 1. Check existing session
        if key in self.sessions:
            session = self.sessions[key]
            session.participants[member.id] = datetime.now(timezone.utc)
            # FORCE REPOST: Ping the joining member and move the UI to the bottom
            await self._refresh_message(session, announcement=f"⚔️ **{member.mention}** has joined the focus ritual!", force_repost=True)
            return

        # 2. Resilient Config Fetch
        async with self.pool.acquire() as conn:
            cfg = await conn.fetchrow(
                'SELECT * FROM pomodoro_configs WHERE guild_id = $1 AND voice_channel_id = $2',
                str(member.guild.id), str(channel.id)
            )
            
            # 3. Fallback to Guild-Global or Default
            if not cfg:
                bot_logger.info(f"🔮 [POMODORO]: No custom config for {channel.name}. Seeking guild default...")
                cfg = await conn.fetchrow('SELECT * FROM pomodoro_configs WHERE guild_id = $1 LIMIT 1', str(member.guild.id))
                
            if not cfg:
                # Absolute Default Case
                bot_logger.info(f"🔮 [POMODORO]: No guild config found. Manifesting system defaults for {channel.name}.")
                cfg = {
                    'focus_duration': 25,
                    'break_duration': 5,
                    'auto_start': True,
                    'auto_stop': True,
                    'text_channel_id': None # Will be resolved in start_session
                }

        if not cfg.get('auto_start', True):
            return

        await self.start_session(member.guild, channel, cfg)

    async def on_member_leave_vc(self, member: discord.Member, channel: discord.VoiceChannel):
        key = (member.guild.id, channel.id)
        if key in self.sessions:
            session = self.sessions[key]
            session.participants.pop(member.id, None)
            
            # 1. Safety Pulse: Wait for Discord state to sync
            await asyncio.sleep(2.0)
            
            # 2. Terminal Vacancy Check
            active_hunters = [m for m in channel.members if not m.bot]
            if not active_hunters:
                await self.stop_session(session, reason="Sanctuary Vacant")
            else:
                await self._refresh_message(session)

    async def start_session(self, guild: discord.Guild, vc: discord.VoiceChannel, cfg):
        """Starts a session with advanced channel resolution."""
        key = (guild.id, vc.id)
        if key in self.sessions: return

        # RESOLVE TEXT CHANNEL
        text_channel = None
        target_id = cfg.get('text_channel_id')
        if target_id:
            text_channel = guild.get_channel(int(target_id))
        
        if not text_channel:
            # Fallback 1: System Channel
            text_channel = guild.system_channel
            # Fallback 2: First available text channel
            if not text_channel:
                text_channel = next((c for c in guild.text_channels if c.permissions_for(guild.me).send_messages), None)

        if not text_channel:
            bot_logger.error(f"❌ [POMODORO]: No valid manifestation point in {guild.name}. Ignition aborted.")
            return

        session = PomodoroSession(
            guild_id        = guild.id,
            vc_id           = vc.id,
            text_channel_id = text_channel.id,
            focus_min       = cfg['focus_duration'],
            break_min       = cfg['break_duration'],
            phase_end       = datetime.now(timezone.utc) + timedelta(minutes=cfg['focus_duration']),
            participants    = {m.id: datetime.now(timezone.utc) for m in vc.members if not m.bot}
        )
        self.sessions[key] = session

        view = PomodoroView(self, key)
        embed = _build_embed(session, [guild.get_member(uid).display_name for uid in session.participants if guild.get_member(uid)], self.bot)
        
        try:
            msg = await text_channel.send(embed=embed, view=view)
            session.message_id = msg.id
            
            async with self.pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO pomodoro_sessions (guild_id, voice_channel_id, text_channel_id, message_id, phase, phase_end_time, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, TRUE)
                    ON CONFLICT (guild_id, voice_channel_id) DO UPDATE SET message_id=$4, is_active=TRUE
                ''', str(guild.id), str(vc.id), str(text_channel.id), str(msg.id), session.phase, session.phase_end)
            
            session.task = asyncio.create_task(self._session_loop(session, key, guild))
            bot_logger.info(f"✅ [POMODORO]: Session ignited in {guild.name} / #{text_channel.name}")
        except Exception as e:
            bot_logger.error(f"❌ [POMODORO]: Start failed: {e}")
            self.sessions.pop(key, None)

    async def stop_session(self, session: PomodoroSession, reason: str = "Complete"):
        key = (session.guild_id, session.vc_id)
        session.phase = 'stopped'
        if session.task: session.task.cancel()

        guild = self.bot.get_guild(session.guild_id)
        if guild and session.message_id:
            text_ch = guild.get_channel(session.text_channel_id)
            if text_ch:
                try:
                    msg = await text_ch.fetch_message(session.message_id)
                    embed = discord.Embed(title="🛡️ SESSION SEALED", description=f"The ritual has ended: **{reason}**", color=0xef4444)
                    await msg.edit(embed=embed, view=None)
                except: pass

        async with self.pool.acquire() as conn:
            await conn.execute('UPDATE pomodoro_sessions SET is_active=FALSE WHERE guild_id=$1 AND voice_channel_id=$2', str(session.guild_id), str(session.vc_id))
        
        self.sessions.pop(key, None)

    async def _session_loop(self, session: PomodoroSession, key: tuple, guild: discord.Guild):
        try:
            while session.phase != 'stopped':
                await asyncio.sleep(30)
                if session.phase == 'paused': continue
                if session.phase_end and datetime.now(timezone.utc) >= session.phase_end:
                    await self._advance_phase(session)
                else:
                    await self._refresh_message(session)
        except asyncio.CancelledError: pass

    async def _advance_phase(self, session: PomodoroSession):
        session.phase = 'break' if session.phase == 'focus' else 'focus'
        dur = session.break_min if session.phase == 'break' else session.focus_min
        session.phase_end = datetime.now(timezone.utc) + timedelta(minutes=dur)
        
        await self._refresh_message(session, announcement=f"⚔️ **Phase Shift: {session.phase.upper()}**")

    async def _refresh_message(self, session: PomodoroSession, announcement: str = None, force_repost: bool = False):
        if not session.message_id and not force_repost: return
        guild = self.bot.get_guild(session.guild_id)
        if not guild: return
        text_ch = guild.get_channel(session.text_channel_id)
        if not text_ch: return

        members = [guild.get_member(uid).display_name for uid in session.participants if guild.get_member(uid)]
        embed   = _build_embed(session, members, self.bot)
        view    = PomodoroView(self, (session.guild_id, session.vc_id))

        try:
            # 1. Handle Repost Ritual (Delete old, manifest new)
            if force_repost and session.message_id:
                try:
                    old_msg = await text_ch.fetch_message(session.message_id)
                    await old_msg.delete()
                except: pass
                session.message_id = None

            # 2. Manifest or Edit
            if not session.message_id:
                msg = await text_ch.send(content=announcement, embed=embed, view=view)
                session.message_id = msg.id
                # Update DB with new message ID
                async with self.pool.acquire() as conn:
                    await conn.execute('UPDATE pomodoro_sessions SET message_id = $1 WHERE guild_id = $2 AND voice_channel_id = $3', 
                                     str(msg.id), str(session.guild_id), str(session.vc_id))
            else:
                msg = await text_ch.fetch_message(session.message_id)
                await msg.edit(content=announcement, embed=embed, view=view)
        except Exception as e:
            bot_logger.error(f"⚠️ [REFRESH]: Ritual failed: {e}")
