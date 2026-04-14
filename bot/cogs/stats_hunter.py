import discord
from discord import app_commands
from discord.ext import commands
from bot.core.database import get_pool
from bot.utils.embeds import create_dungeon_embed
from bot.utils.logger import bot_logger
from bot.config import Settings
import math

class StatsHunter(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name='l')
    async def leaderboard_cmd(self, ctx):
        """View the Hunter leaderboard."""
        await self.show_leaderboard(ctx.message)

    @commands.command(name='m')
    async def profile_cmd(self, ctx):
        """View your Hunter stats."""
        await self.show_profile(ctx.message)

    @app_commands.command(name="rank", description="Displays the global top hunters leaderboard")
    async def rank_slash(self, interaction: discord.Interaction):
        """Slash version of leaderboard."""
        await self.show_leaderboard(interaction)

    @app_commands.command(name="level", description="Displays your personal huntsman player card")
    async def level_slash(self, interaction: discord.Interaction):
        """Slash version of profile."""
        await self.show_profile(interaction)

    async def _check_channel_restrictions(self, source):
        """Returns True if command is allowed, False otherwise. Handles Message or Interaction."""
        is_interaction = isinstance(source, discord.Interaction)
        guild = source.guild
        channel = source.channel
        user = source.user if is_interaction else source.author

        pool = get_pool()
        if not pool:
            return False

        try:
            async with pool.acquire() as conn:
                config = await conn.fetchrow('SELECT bot_command_channel_id FROM guild_configs WHERE guild_id = $1', str(guild.id))
        except Exception as e:
            bot_logger.error(f"[StatsHunter] Error fetching: {e}")
            return False

        if config and config['bot_command_channel_id']:
            allowed_channel = str(config['bot_command_channel_id'])
            current_channel = str(channel.id)
            
            if current_channel != allowed_channel:
                msg = f"❌ **Blocked:** Commands must only be used in <#{allowed_channel}> to preserve focus."
                try:
                    if is_interaction:
                        await source.response.send_message(msg, ephemeral=True)
                    else:
                        await source.delete()
                        await user.send(msg)
                except:
                    pass
                return False
        return True

    async def _send_response(self, source, embed=None, content=None):
        """Unified response ritual for both contexts."""
        if isinstance(source, discord.Interaction):
            await source.response.send_message(content=content, embed=embed)
        else:
            await source.channel.send(content=content, embed=embed)

    async def show_leaderboard(self, source):
        if not await self._check_channel_restrictions(source):
            return

        pool = get_pool()
        if not pool:
            return await self._send_response(source, content="System is currently experiencing database latency.")
            
        guild_id = str(source.guild.id)
        try:
            async with pool.acquire() as conn:
                # 1. Manifest Data Ritual (Filtering Ghost Hunters)
                hunters = await conn.fetch(
                    '''
                    SELECT user_id, total_study_hours, level, total_xp
                    FROM user_levels
                    WHERE guild_id = $1 
                      AND level > 0 
                      AND total_xp > 0 
                      AND total_study_hours > 0
                    ORDER BY total_study_hours DESC
                    ''',
                    guild_id
                )

            if not hunters:
                embed = create_dungeon_embed("⚔️ RANKING: TOP HUNTERS", "No qualified hunters have manifested in this realm yet.")
                return await self._send_response(source, embed=embed)

            # 2. Ignite Pagination View
            invoker = source.user if isinstance(source, discord.Interaction) else source.author
            view = LeaderboardView(hunters, invoker)
            embed = view.create_embed()
            
            if isinstance(source, discord.Interaction):
                await source.response.send_message(embed=embed, view=view)
            else:
                await source.channel.send(embed=embed, view=view)

        except Exception as e:
            bot_logger.error(f"Leaderboard Manifestation Error: {e}")

class LeaderboardView(discord.ui.View):
    def __init__(self, hunters, invoker):
        # ── Initialization Ritual ──
        # No logic or permission checks here to prevent startup flatlines.
        super().__init__(timeout=60)
        self.hunters = hunters
        self.invoker = invoker
        self.current_page = 0
        self.per_page = 5
        self.total_pages = math.ceil(len(hunters) / self.per_page)

    def create_embed(self):
        # Embed generation logic (Execution Phase)
        embed = discord.Embed(
            title="⚔️ RANKING: TOP HUNTERS",
            description="",
            color=0x4b8bf5
        )
        
        start = self.current_page * self.per_page
        end = start + self.per_page
        page_hunters = self.hunters[start:end]
        
        entries = []
        for i, hunter in enumerate(page_hunters, start + 1):
            rank = i
            # Record access safety
            try:
                user_id = hunter['user_id']
                lvl = hunter['level']
                hours = float(hunter['total_study_hours'])
            except (KeyError, TypeError) as e:
                bot_logger.error(f"Leaderboard data corruption: {e}")
                continue
                
            # 🏆 Rank Tier Ritual
            if rank == 1:
                tier = "🏆 #1 — S-RANK HUNTER"
            elif rank == 2:
                tier = "🥈 #2 — A-RANK HUNTER"
            elif rank == 3:
                tier = "🥉 #3 — B-RANK HUNTER"
            else:
                tier = f"#{rank} — C-RANK HUNTER"
            
            entry = f"**{tier}**\n<@{user_id}>\n`Lvl {lvl} • {hours:.1f}h`"
            entries.append(entry)

        embed.description = "\n\n".join(entries) if entries else "No hunters Manifested in this page."
        embed.set_footer(text=f"Page {self.current_page + 1}/{self.total_pages} • Total Hunters: {len(self.hunters)}")
        
        self.update_buttons()
        return embed

    def update_buttons(self):
        self.prev_button.disabled = self.current_page == 0
        self.next_button.disabled = self.current_page >= self.total_pages - 1

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        # Safety Guard: Ensure context is resolved
        if not interaction.user:
            return False
            
        if interaction.user.id != self.invoker.id:
            try:
                await interaction.response.send_message("❌ This ritual can only be controlled by the invoker.", ephemeral=True)
            except:
                pass
            return False
        return True

    @discord.ui.button(label="◀️ Previous", style=discord.ButtonStyle.secondary)
    async def prev_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page -= 1
        await interaction.response.edit_message(embed=self.create_embed(), view=self)

    @discord.ui.button(label="Next ▶️", style=discord.ButtonStyle.secondary)
    async def next_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page += 1
        await interaction.response.edit_message(embed=self.create_embed(), view=self)

    async def show_profile(self, source):
        if not await self._check_channel_restrictions(source):
            return

        pool = get_pool()
        if not pool:
            return await self._send_response(source, content="System is currently experiencing database latency.")
            
        guild_id = str(source.guild.id)
        user = source.user if isinstance(source, discord.Interaction) else source.author
        user_id = str(user.id)
        
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    'SELECT * FROM user_levels WHERE guild_id = $1 AND user_id = $2',
                    guild_id, user_id
                )
            
            if not row:
                return await self._send_response(source, content="No hunter stats found for this identity.")

            embed = create_dungeon_embed(f"PLAYER CARD")
            embed.set_author(name=f"{user.name} (Hunter Identity)", icon_url=user.display_avatar.url)
            embed.set_thumbnail(url=user.display_avatar.url)
            
            embed.description = f"**Status:** Verified\n**Identity:** <@{user_id}>"
            embed.add_field(name="LEVEL", value=f"`{row['level']}`", inline=True)
            embed.add_field(name="TOTAL TIME", value=f"`{float(row['total_study_hours']):.1f}h`", inline=True)
            embed.add_field(name="TOTAL XP", value=f"`{row['total_xp']}`", inline=True)
            
            embed.set_image(url=Settings.BACKGROUND_URL)
            await self._send_response(source, embed=embed)
        except Exception as e:
            bot_logger.error(f"Error fetching profile: {e}")
        except Exception as e:
            bot_logger.error(f"Error fetching profile: {e}")

async def setup(bot):
    await bot.add_cog(StatsHunter(bot))
