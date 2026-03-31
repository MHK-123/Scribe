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

def _progress_bar(elapsed: int, total: int, width: int = 20) -> str:
    """Neon-style text-art progress bar."""
    ratio = min(elapsed / total, 1.0) if total > 0 else 0
    filled = int(ratio * width)
    empty  = width - filled
    bar    = '█' * filled + '░' * empty
    pct    = int(ratio * 100)
    return f"`{bar}` {pct}%"

def _build_embed(session: 'PomodoroSession', member_names: list[str]) -> discord.Embed:
    """Build the Solo Leveling dungeon-themed embed."""
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

    # Phase config
    if is_focus:
        phase_label  = '⚔️  FOCUS MODE'
        phase_color  = 0x4b8bf5   # electric blue
        total_sec    = session.focus_min * 60
        next_phase   = '🌙 Break'
        phase_icon   = '⚔️'
    elif session.phase == 'break':
        phase_label  = '🌙  BREAK MODE'
        phase_color  = 0x7b5cf0   # purple
        total_sec    = session.break_min * 60
        next_phase   = '⚔️ Focus'
        phase_icon   = '🌙'
    else:
        phase_label  = '⏸  PAUSED'
        phase_color  = 0x3a3a5c
        total_sec    = session.focus_min * 60
        next_phase   = '▶️ Resume'
        phase_icon   = '⏸'

    elapsed_sec = max(0, total_sec - remaining_sec)
    cycles_str  = f"{session.current_cycle} / {'∞' if session.total_cycles == 0 else session.total_cycles}"

    # Build description — dungeon system panel
    time_display  = _fmt_time(remaining_sec)
    progress      = _progress_bar(elapsed_sec, total_sec)
    next_min      = remaining_sec // 60

    desc_lines = [
        f"```ansi",
        f"\u001b[1;36m╔══════════════════════════════════╗\u001b[0m",
        f"\u001b[1;36m║    ⚔️  H U N T E R   S Y S T E M    ║\u001b[0m",
        f"\u001b[1;36m╚══════════════════════════════════╝\u001b[0m",
        f"```",
        f"",
        f"**{phase_label}** — Cycle `{cycles_str}`",
        f"",
        progress,
        f"",
        f"## ⏱  `{time_display}`",
        f"",
        f"> {next_phase} starts in **{next_min} min**" if not is_paused else "> Session is **paused** — click Resume to continue",
    ]
    description = '\n'.join(desc_lines)

    embed = discord.Embed(
        description=description,
        color=phase_color,
        timestamp=now,
    )
    embed.set_author(
        name="SCRIBE · FOCUS SYSTEM",
        icon_url="https://i.imgur.com/MFZnNba.png"
    )

    # Participants
    if member_names:
        hunters = '\n'.join(f'`⚔` {name}' for name in member_names[:10])
        embed.add_field(
            name=f"👥 Active Hunters  [{len(member_names)}]",
            value=hunters,
            inline=False,
        )
    else:
        embed.add_field(name="👥 Hunters", value="*Waiting for hunters to join...*", inline=False)

    # Stats row
    embed.add_field(name="🔁 Cycle",     value=f"`{cycles_str}`",      inline=True)
    embed.add_field(name="⚔️ Phase",     value=f"`{phase_label}`",     inline=True)
    embed.add_field(name="⏱ Remaining", value=f"`{time_display}`",    inline=True)

    embed.set_footer(text="Scribe · Study System  •  Updates every 30s")
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
            await interaction.response.send_message("▶️ Session resumed!", ephemeral=True)
        else:
            now = datetime.now(timezone.utc)
            session.paused_remaining = max(0, int((session.phase_end - now).total_seconds())) if session.phase_end else 0
            session.phase = 'paused'
            button.label  = '▶️ Resume'
            await interaction.response.send_message("⏸ Session paused.", ephemeral=True)
        await self.manager._refresh_message(session)

    @discord.ui.button(label='⏭ Skip', style=discord.ButtonStyle.primary, custom_id='pomo_skip', row=0)
    async def skip_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        session = self._get_session()
        if not session:
            return await interaction.response.send_message("No active session.", ephemeral=True)
        await self.manager._advance_phase(session)
        await interaction.response.send_message("⏭ Phase skipped!", ephemeral=True)

    @discord.ui.button(label='➕ +5 min', style=discord.ButtonStyle.secondary, custom_id='pomo_extend', row=1)
    async def extend_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        session = self._get_session()
        if not session:
            return await interaction.response.send_message("No active session.", ephemeral=True)
        if session.phase_end:
            session.phase_end += timedelta(minutes=5)
            await self.manager._refresh_message(session)
        await interaction.response.send_message("➕ Extended by 5 minutes!", ephemeral=True)

    @discord.ui.button(label='⏹ Stop', style=discord.ButtonStyle.danger, custom_id='pomo_stop', row=1)
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
            self.sessions[key].participants[member.id] = datetime.now(timezone.utc)
        else:
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
            return

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
        embed = _build_embed(session, [guild.get_member(uid).display_name for uid in participants if guild.get_member(uid)])
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
                    stopped_embed.set_footer(text="Session ended")
                    await msg.edit(embed=stopped_embed, view=None)
                    await text_ch.send(f"🏆 **Session complete!** Great work, Hunters. `{reason}`")
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
            if text_ch:
                try:
                    await text_ch.send(
                        f"🌙 **Break time!** {vc_mentions}\n"
                        f"> Rest for `{session.break_min} min`. Focus resumes after.",
                    )
                except discord.HTTPException:
                    pass
        else:
            session.current_cycle += 1
            session.phase     = 'focus'
            session.phase_end = now + timedelta(minutes=session.focus_min)
            if text_ch:
                try:
                    await text_ch.send(
                        f"⚔️ **Focus Mode — Cycle {session.current_cycle}!** {vc_mentions}\n"
                        f"> Break is over. Lock in for `{session.focus_min} min`.",
                    )
                except discord.HTTPException:
                    pass

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

        await self._refresh_message(session)

    async def _refresh_message(self, session: PomodoroSession):
        """Edit the pinned embed message with updated timer."""
        if not session.message_id:
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
        embed = _build_embed(session, member_names)
        key   = (session.guild_id, session.vc_id)
        view  = PomodoroView(self, key)

        try:
            msg = await text_ch.fetch_message(session.message_id)
            await msg.edit(embed=embed, view=view)
        except (discord.HTTPException, discord.NotFound) as e:
            print(f'[Pomodoro] Failed to edit message: {e}')

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
