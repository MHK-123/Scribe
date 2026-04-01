"""
Scribe Pomodoro Engine
Dungeon-themed study timer system with Discord embeds + buttons.
"""
import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

import discord

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
        phase_color  = 0x4b8bf5   # electric blue (glowing)
        next_phase   = f"🌙 Break in {remaining_sec // 60}m"
    elif session.phase == 'break':
        phase_label  = 'BREAK MODE'
        phase_color  = 0x7b5cf0   # purple (glowing)
        next_phase   = f"⚔️ Focus in {remaining_sec // 60}m"
    else:
        phase_label  = 'SYSTEM PAUSED'
        phase_color  = 0x3a3a5c
        next_phase   = "▶️ Resume to continue"

    cycles_str = f"{session.current_cycle} / {session.total_cycles or '∞'}"
    time_str   = _fmt_time(remaining_sec)
    sys_bar    = _system_bar(elapsed_sec, total_sec)

    # Build HUD Content
    hunters_count = len(member_names)
    hunters_list  = f"👥 **{hunters_count} Active Hunter{'s' if hunters_count != 1 else ''}**: {', '.join(member_names[:5])}" if member_names else "👥 **No Hunters Active**"

    description = (
        f"```ansi\n"
        f"\u001b[1;37m        SCRIBE SYSTEM\u001b[0m\n"
        f"\u001b[1;30m    ⚔️  {phase_label} ACTIVE — CYCLE {cycles_str}\u001b[0m\n"
        f"```\n"
        f"# ⏱  `{time_str}`\n"
        f"**{phase_label}**\n\n"
        f"```ansi\n"
        f"{sys_bar}\n"
        f"```\n"
        f"> {next_phase}\n"
        f"{hunters_list}"
    )

    embed = discord.Embed(
        description=description,
        color=phase_color,
        timestamp=now,
    )
    embed.set_author(
        name="SCRIBE · FOCUS SYSTEM",
        icon_url="https://i.imgur.com/MFZnNba.png"
    )
    # Background "Dungeon" aesthetics (Public URL provided by user)
    try:
        image_url = "https://image2url.com/r2/default/images/1775042958395-2815bf82-1b57-406a-87a6-ef0d0a2580c7.png"
        embed.set_image(url=image_url) 
    except Exception as e:
        print(f"[Pomodoro] Image URL error: {e}")

    return embed

# ─── Session Data ──────────────────────────────────────────────────────────────

@dataclass
class PomodoroSession:
    guild_id:        int
    vc_id:           int
    text_channel_id: int
    focus_min:       int
    break_min:       int
    total_cycles:    int       # 0 = infinite
    auto_stop:       bool      = True

    current_cycle:   int       = 1
    phase:           str       = 'focus'   # focus | break | paused | stopped
    phase_end:       Optional[datetime] = None
    paused_remaining: Optional[int]     = None  # seconds left when paused

    message_id:      Optional[int]      = None
    task:            Optional[asyncio.Task] = field(default=None, repr=False)
    participants:    dict               = field(default_factory=dict)  # user_id → join_time
    session_start:   datetime           = field(default_factory=lambda: datetime.now(timezone.utc))

# ─── Button View ──────────────────────────────────────────────────────────────

class PomodoroView(discord.ui.View):
    def __init__(self, manager: 'PomodoroManager', key: tuple):
        super().__init__(timeout=None)
        self.manager = manager
        self.key     = key  # (guild_id, vc_id)

    def _get_session(self) -> Optional[PomodoroSession]:
        return self.manager.sessions.get(self.key)

    @discord.ui.button(label='✅ Join', style=discord.ButtonStyle.success, custom_id='pomo_join', row=0)
    async def join_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        session = self._get_session()
        if not session:
            return await interaction.response.send_message("No active session.", ephemeral=True)
        uid = interaction.user.id
        if uid not in session.participants:
            session.participants[uid] = datetime.now(timezone.utc)
        await interaction.response.send_message(
            f"⚔️ **{interaction.user.display_name}** has entered the dungeon!", ephemeral=True
        )

    @discord.ui.button(label='⏸ Pause', style=discord.ButtonStyle.secondary, custom_id='pomo_pause', row=0)
    async def pause_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        session = self._get_session()
        if not session:
            return await interaction.response.send_message("No active session.", ephemeral=True)
        if session.phase == 'paused':
            # Resume
            session.phase_end = datetime.now(timezone.utc) + timedelta(seconds=session.paused_remaining or 0)
            session.phase     = 'focus' if session.paused_remaining is not None else 'break'
            session.paused_remaining = None
            button.label = '⏸ Pause'
            button.style = discord.ButtonStyle.secondary
            await interaction.response.send_message("▶️ Session resumed!", ephemeral=True)
        else:
            now = datetime.now(timezone.utc)
            session.paused_remaining = max(0, int((session.phase_end - now).total_seconds())) if session.phase_end else 0
            session.phase = 'paused'
            button.label  = '▶️ Resume'
            button.style  = discord.ButtonStyle.success
            await interaction.response.send_message("⏸ Session paused.", ephemeral=True)
        await self.manager._refresh_message(session)

    @discord.ui.button(label='➕ +5 min', style=discord.ButtonStyle.secondary, custom_id='pomo_extend', row=0)
    async def extend_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        session = self._get_session()
        if not session:
            return await interaction.response.send_message("No active session.", ephemeral=True)
        if session.phase_end:
            session.phase_end += timedelta(minutes=5)
            await self.manager._refresh_message(session)
        await interaction.response.send_message("➕ Extended by 5 minutes!", ephemeral=True)

    @discord.ui.button(label='⏹ Stop', style=discord.ButtonStyle.danger, custom_id='pomo_stop', row=0)
    async def stop_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Only guild admins can stop
        if not interaction.user.guild_permissions.manage_channels:
            return await interaction.response.send_message("🔒 Manage Channels permission required.", ephemeral=True)
        session = self._get_session()
        if not session:
            return await interaction.response.send_message("No active session.", ephemeral=True)
        await self.manager.stop_session(session, reason="Stopped by moderator")
        await interaction.response.send_message("⏹ Session stopped.", ephemeral=True)

# ─── Pomodoro Manager ─────────────────────────────────────────────────────────

class PomodoroManager:
    """Manages all active Pomodoro sessions across guilds."""

    def __init__(self, bot: discord.Client, pool):
        self.bot      = bot
        self.pool     = pool
        self.sessions: dict[tuple, PomodoroSession] = {}

    async def load_active_sessions(self):
        """Reload active sessions from DB on startup (e.g. after bot restart)."""
        print('[Pomodoro] Reloading active sessions from archive...')
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM pomodoro_sessions WHERE is_active = TRUE')
            for row in rows:
                guild = self.bot.get_guild(int(row['guild_id']))
                if not guild: continue
                vc    = guild.get_channel(int(row['voice_channel_id']))
                if not vc: continue
                
                key = (int(row['guild_id']), int(row['voice_channel_id']))
                participants = {m.id: datetime.now(timezone.utc) for m in vc.members if not m.bot}
                
                session = PomodoroSession(
                    guild_id        = int(row['guild_id']),
                    vc_id           = int(row['voice_channel_id']),
                    text_channel_id = int(row['text_channel_id']),
                    focus_min       = 25, # Default, or fetch from config
                    break_min       = 5,  # Default
                    total_cycles    = row['total_cycles'],
                    auto_stop       = True,
                    phase           = row['phase'],
                    phase_end       = row['phase_end_time'],
                    current_cycle   = row['current_cycle'],
                    message_id      = int(row['message_id']) if row['message_id'] else None,
                    participants    = participants,
                )
                
                # Try to re-fetch more detailed config
                cfg = await conn.fetchrow('SELECT * FROM pomodoro_configs WHERE guild_id = $1 AND voice_channel_id = $2', row['guild_id'], row['voice_channel_id'])
                if cfg:
                    session.focus_min = cfg['focus_duration']
                    session.break_min = cfg['break_duration']
                    session.auto_stop = cfg['auto_stop']

                self.sessions[key] = session
                session.task = asyncio.create_task(self._session_loop(session, key, guild))
        print(f'[Pomodoro] Successfully restored {len(self.sessions)} sessions.')

    # ── Public API ────────────────────────────────────────────────────────────

    async def on_member_join_vc(self, member: discord.Member, channel: discord.VoiceChannel):
        """Call when a member joins any voice channel."""
        key = (member.guild.id, channel.id)

        # Fetch config for this VC
        async with self.pool.acquire() as conn:
            cfg = await conn.fetchrow(
                'SELECT * FROM pomodoro_configs WHERE guild_id = $1 AND voice_channel_id = $2',
                str(member.guild.id), str(channel.id)
            )
        if not cfg or not cfg['auto_start']:
            return

        if key in self.sessions:
            # Session exists — add participant
            print(f"[Pomodoro] Member {member.name} joined existing session {key}")
            self.sessions[key].participants[member.id] = datetime.now(timezone.utc)
            await self._refresh_message(self.sessions[key])
        else:
            print(f"[Pomodoro] Triggering new session for {key}")
            await self.start_session(member.guild, channel, cfg)

    async def on_member_leave_vc(self, member: discord.Member, channel: discord.VoiceChannel):
        """Call when a member leaves any voice channel."""
        key = (member.guild.id, channel.id)
        session = self.sessions.get(key)
        if not session:
            return

        session.participants.pop(member.id, None)

        # Auto-stop if empty and configured
        remaining_members = [m for m in channel.members if not m.bot]
        if not remaining_members and session.auto_stop:
            await self.stop_session(session, reason="VC became empty")

    async def start_session(self, guild: discord.Guild, vc: discord.VoiceChannel, cfg):
        """Create and start a new Pomodoro session."""
        key = (guild.id, vc.id)
        if key in self.sessions:
            return  # already running

        text_channel = guild.get_channel(int(cfg['text_channel_id']))
        if not text_channel:
            print(f"[Pomodoro] CRITICAL: Text channel {cfg['text_channel_id']} not found for {guild.name}")
            return
        
        print(f"[Pomodoro] Starting new session in #{text_channel.name}")

        # 1. Check for an existing session message ID for this VC in the DB
        existing_msg_id = None
        async with self.pool.acquire() as conn:
            existing_msg_id = await conn.fetchval(
                'SELECT message_id FROM pomodoro_sessions WHERE guild_id = $1 AND voice_channel_id = $2',
                str(guild.id), str(vc.id)
            )

        # Try to cleanup the old message if it exists (Single message policy)
        if existing_msg_id:
            try:
                old_msg = await text_channel.fetch_message(int(existing_msg_id))
                await old_msg.delete()
            except (discord.NotFound, discord.HTTPException):
                pass

        # Initial participants = current non-bot members
        participants = {
            m.id: datetime.now(timezone.utc)
            for m in vc.members if not m.bot
        }

        session = PomodoroSession(
            guild_id        = guild.id,
            vc_id           = vc.id,
            text_channel_id = int(cfg['text_channel_id']),
            focus_min       = cfg['focus_duration'],
            break_min       = cfg['break_duration'],
            total_cycles    = cfg['cycles'],
            auto_stop       = cfg['auto_stop'],
            phase           = 'focus',
            phase_end       = datetime.now(timezone.utc) + timedelta(minutes=cfg['focus_duration']),
            participants    = participants,
        )
        self.sessions[key] = session

        # Build and send initial embed
        view  = PomodoroView(self, key)
        embed = _build_embed(session, [guild.get_member(uid).display_name for uid in participants if guild.get_member(uid)], self.bot)
        try:
            msg = await text_channel.send(
                content=self._phase_announcement(session, guild, participants),
                embed=embed,
                view=view,
            )
            session.message_id = msg.id

            # Persist to DB
            async with self.pool.acquire() as conn:
                await conn.execute(
                    '''INSERT INTO pomodoro_sessions
                       (guild_id, voice_channel_id, text_channel_id, message_id,
                        phase, phase_end_time, current_cycle, total_cycles, is_active)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
                       ON CONFLICT (guild_id, voice_channel_id) DO UPDATE
                       SET message_id=$4, phase=$5, phase_end_time=$6,
                           current_cycle=$7, total_cycles=$8, is_active=TRUE, started_at=NOW()''',
                    str(guild.id), str(vc.id), str(cfg['text_channel_id']), str(msg.id),
                    session.phase, session.phase_end, session.current_cycle, session.total_cycles
                )
        except discord.HTTPException as e:
            print(f'[Pomodoro] Failed to send embed: {e}')
            self.sessions.pop(key, None)
            return

        # Start background timer loop
        session.task = asyncio.create_task(self._session_loop(session, key, guild))
        print(f'[Pomodoro] Session started — {guild.name} / #{text_channel.name}')

    async def stop_session(self, session: PomodoroSession, reason: str = "Session complete"):
        """Stop and clean up a session."""
        key = (session.guild_id, session.vc_id)
        session.phase = 'stopped'

        if session.task and not session.task.done():
            session.task.cancel()

        # Update embed to stopped state
        guild = self.bot.get_guild(session.guild_id)
        if guild:
            text_ch = guild.get_channel(session.text_channel_id)
            if text_ch and session.message_id:
                try:
                    msg = await text_ch.fetch_message(session.message_id)
                    stopped_embed = discord.Embed(
                        description=(
                            "```ansi\n"
                            "\u001b[1;31m╔══════════════════════════════════╗\u001b[0m\n"
                            "\u001b[1;31m║    ⚔️  SESSION COMPLETE           ║\u001b[0m\n"
                            "\u001b[1;31m╚══════════════════════════════════╝\u001b[0m\n"
                            "```\n"
                            f"\n⚔️ **{reason}**\n\n"
                            f"Well done, Hunters. Rest and return stronger."
                        ),
                        color=0x2ecc71,
                        timestamp=datetime.now(timezone.utc),
                    )
                    stopped_embed.set_author(name="SCRIBE · FOCUS SYSTEM")
                    # End session visualization
                    await self._refresh_message(session, announcement=f"⏹ **{reason}**")
                except (discord.HTTPException, discord.NotFound):
                    pass

        # Remove from DB
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    'UPDATE pomodoro_sessions SET is_active=FALSE WHERE guild_id=$1 AND voice_channel_id=$2',
                    str(session.guild_id), str(session.vc_id)
                )
        except Exception as e:
            print(f'[Pomodoro] DB cleanup error: {e}')

        self.sessions.pop(key, None)
        print(f'[Pomodoro] Session stopped — {reason}')

    # ── Internal ──────────────────────────────────────────────────────────────

    async def _session_loop(self, session: PomodoroSession, key: tuple, guild: discord.Guild):
        """Background task: updates embed every 30s, handles phase transitions."""
        try:
            while session.phase != 'stopped':
                await asyncio.sleep(30)

                if session.phase == 'paused':
                    continue

                now = datetime.now(timezone.utc)
                if session.phase_end and now >= session.phase_end:
                    await self._advance_phase(session)
                else:
                    await self._refresh_message(session)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f'[Pomodoro] Loop error: {e}')

    async def _advance_phase(self, session: PomodoroSession):
        """Switch between focus and break, handle cycle completion."""
        guild = self.bot.get_guild(session.guild_id)
        if not guild:
            return

        text_ch = guild.get_channel(session.text_channel_id)
        now     = datetime.now(timezone.utc)

        vc = guild.get_channel(session.vc_id)
        vc_mentions = (
            ' '.join(f'<@{m.id}>' for m in vc.members if not m.bot)
            if vc else ''
        )

        if session.phase == 'focus':
            # Award XP to all current VC members for completing focus phase
            await self._award_phase_xp(session, guild)

            # Check if all cycles done
            if session.total_cycles > 0 and session.current_cycle >= session.total_cycles:
                await self.stop_session(session, reason=f"All {session.total_cycles} cycles complete! 🏆")
                return
            session.phase     = 'break'
            session.phase_end = now + timedelta(minutes=session.break_min)
            announcement      = f"🌙 **Break time!** {vc_mentions}\n> Rest for `{session.break_min} min`."
        else:
            session.current_cycle += 1
            session.phase     = 'focus'
            session.phase_end = now + timedelta(minutes=session.focus_min)
            announcement      = f"⚔️ **Focus Mode — Cycle {session.current_cycle}!** {vc_mentions}\n> Lock in for `{session.focus_min} min`."

        # Update DB
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    'UPDATE pomodoro_sessions SET phase=$1, phase_end_time=$2, current_cycle=$3 WHERE guild_id=$4 AND voice_channel_id=$5',
                    session.phase, session.phase_end, session.current_cycle,
                    str(session.guild_id), str(session.vc_id)
                )
        except Exception:
            pass

        await self._refresh_message(session, announcement=announcement)

    async def _refresh_message(self, session: PomodoroSession, announcement: str = None):
        """Edit the pinned embed message with updated timer."""
        if not session.message_id and session.phase != 'stopped':
            return
        guild   = self.bot.get_guild(session.guild_id)
        if not guild:
            return
        text_ch = guild.get_channel(session.text_channel_id)
        if not text_ch:
            return

        member_names = [
            guild.get_member(uid).display_name
            for uid in session.participants
            if guild.get_member(uid)
        ]
        embed = _build_embed(session, member_names, self.bot)
        key   = (session.guild_id, session.vc_id)
        view  = PomodoroView(self, key)

        try:
            msg = await text_ch.fetch_message(session.message_id)
            if session.phase == 'stopped':
                # Final edit state
                stopped_embed = discord.Embed(
                    description=(
                        "```ansi\n"
                        "\u001b[1;31m╔══════════════════════════════════╗\u001b[0m\n"
                        "\u001b[1;31m║    ⚔️  SESSION COMPLETE           ║\u001b[0m\n"
                        "\u001b[1;31m╚══════════════════════════════════╝\u001b[0m\n"
                        "```\n"
                        f"\n{announcement or '⚔️ **Session Complete**'}\n\n"
                        f"Well done, Hunters. Rest and return stronger."
                    ),
                    color=0x2ecc71,
                    timestamp=datetime.now(timezone.utc),
                )
                stopped_embed.set_author(name="SCRIBE · FOCUS SYSTEM")
                stopped_embed.set_footer(text="Session ended")
                await msg.edit(content=None, embed=stopped_embed, view=None)
            else:
                await msg.edit(content=announcement or msg.content, embed=embed, view=view)
        except (discord.HTTPException, discord.NotFound) as e:
            # If message deleted, try to re-send unless stopped
            if session.phase != 'stopped':
                try:
                    new_msg = await text_ch.send(content=announcement, embed=embed, view=view)
                    session.message_id = new_msg.id
                    # Update DB
                    async with self.pool.acquire() as conn:
                        await conn.execute('UPDATE pomodoro_sessions SET message_id=$1 WHERE guild_id=$2 AND voice_channel_id=$3', str(new_msg.id), str(session.guild_id), str(session.vc_id))
                except Exception:
                    pass

    def _phase_announcement(self, session: PomodoroSession, guild: discord.Guild, participants: dict) -> str:
        mentions = ' '.join(f'<@{uid}>' for uid in participants) if participants else '@everyone'
        return (
            f"🎧 **Pomodoro is now in FOCUS!** Stay locked in.\n"
            f"> Break starts in **{session.focus_min} minutes** · Cycle `1/{session.total_cycles or '∞'}`\n"
            f"{mentions}"
        )

    async def _award_phase_xp(self, session: PomodoroSession, guild: discord.Guild):
        """Award XP + study hours to all non-bot VC members for completing a focus phase."""
        vc = guild.get_channel(session.vc_id)
        if not vc:
            return

        members = [m for m in vc.members if not m.bot]
        if not members:
            return

        xp_gained    = session.focus_min * 10   # 10 XP per minute (matches regular session rate)
        hours_gained = session.focus_min / 60.0

        try:
            async with self.pool.acquire() as conn:
                for member in members:
                    row = await conn.fetchrow(
                        '''
                        INSERT INTO user_levels (user_id, guild_id, total_xp, total_study_hours)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (user_id, guild_id) DO UPDATE
                            SET total_xp          = user_levels.total_xp + EXCLUDED.total_xp,
                                total_study_hours = user_levels.total_study_hours + EXCLUDED.total_study_hours,
                                last_updated      = CURRENT_TIMESTAMP
                        RETURNING total_xp, level
                        ''',
                        str(member.id), str(session.guild_id), xp_gained, hours_gained
                    )
                    if row:
                        import math
                        new_level = int(math.sqrt(row['total_xp'] / 100))
                        if new_level > row['level']:
                            await conn.execute(
                                'UPDATE user_levels SET level = $1 WHERE user_id = $2 AND guild_id = $3',
                                new_level, str(member.id), str(session.guild_id)
                            )
            print(f'[Pomodoro] Awarded {xp_gained} XP to {len(members)} member(s) for focus cycle.')
        except Exception as e:
            print(f'[Pomodoro] XP award error: {e}')
