import discord
from discord import app_commands
from discord.ext import commands
from bot.core.database import get_pool
from bot.utils.embeds import create_dungeon_embed
from bot.utils.logger import bot_logger
from bot.config import Settings

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

            embed = create_dungeon_embed("RANKING: TOP HUNTERS", "Top hunters by focus time.")
            
            if not top_hunters:
                embed.description = "```\nNo hunters found in this realm yet.\n```"
            else:
                ranks, users, stats = [], [], []
                for i, row in enumerate(top_hunters, 1):
                    ranks.append(f"`#{i}`")
                    users.append(f"<@{row['user_id']}>")
                    stats.append(f"`Lvl {row['level']} | {float(row['total_study_hours']):.1f}h`")
                
                embed.add_field(name="Rank", value="\n".join(ranks), inline=True)
                embed.add_field(name="Hunter", value="\n".join(users), inline=True)
                embed.add_field(name="Level | Time", value="\n".join(stats), inline=True)

            await self._send_response(source, embed=embed)
        except Exception as e:
            bot_logger.error(f"Error fetching leaderboard: {e}")

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
