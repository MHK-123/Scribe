import discord
from discord import app_commands
from discord.ext import commands
from bot.utils.logger import bot_logger
from bot.utils.embeds import create_success_embed, create_error_embed, create_dungeon_embed

class Admin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="config", description="Recalibrate your sanctum nodes via the web dashboard")
    @app_commands.checks.has_permissions(administrator=True)
    async def config_dashboard(self, interaction: discord.Interaction):
        """Gateway to the Scribe Calibration Dashboard."""
        embed = create_dungeon_embed(
            "CORE CALIBRATION",
            "Manifest your sanctuary's parameters through the central interface node."
        )
        embed.add_field(name="Dashboard Link", value=f"[IGNITE DASHBOARD](https://scribe-azure.vercel.app/setup)")
        embed.set_footer(text="Administrator Authority Verified")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="setup", description="Ignite the sanctuary calibration wizard")
    @app_commands.checks.has_permissions(administrator=True)
    async def setup_wizard(self, interaction: discord.Interaction):
        """Gateway to the Scribe Setup Wizard."""
        embed = create_dungeon_embed(
            "WIZARD CALIBRATION",
            "Ignite the calibration ritual to manifest your sanctuary for the first time."
        )
        embed.add_field(name="Wizard Link", value=f"[IGNITE WIZARD](https://scribe-azure.vercel.app/setup)")
        embed.set_footer(text="Administrator Authority Verified")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @commands.command(name='sync')
    @commands.is_owner()
    async def sync_global(self, ctx):
        """[Owner Only] Sync slash commands globally."""
        try:
            bot_logger.info(f"Admin {ctx.author} triggered global sync.")
            synced = await self.bot.tree.sync()
            embed = create_success_embed(
                "GLOBAL SYNC COMPLETE",
                f"Successfully propagated `{len(synced)}` command nodes to the global network."
            )
            await ctx.send(embed=embed)
        except Exception as e:
            bot_logger.error(f"Global sync failed: {e}")
            await ctx.send(embed=create_error_embed("SYNC FAILED", str(e)))

    @commands.command(name='sync-guild')
    @commands.has_permissions(administrator=True)
    async def sync_guild_command(self, ctx):
        """[Admin Only] Force sync commands to this guild."""
        try:
            bot_logger.info(f"Admin {ctx.author} triggered guild sync for {ctx.guild.id}.")
            self.bot.tree.copy_global_to(guild=ctx.guild)
            synced = await self.bot.tree.sync(guild=ctx.guild)
            embed = create_success_embed(
                "GUILD SYNC COMPLETE",
                f"Successfully updated `{len(synced)}` local command nodes for this realm."
            )
            await ctx.send(embed=embed)
        except Exception as e:
            bot_logger.error(f"Guild sync failed: {e}")
            await ctx.send(embed=create_error_embed("SYNC FAILED", str(e)))

    async def cog_command_error(self, ctx, error):
        if isinstance(error, (commands.NotOwner, commands.MissingPermissions)):
            embed = create_error_embed(
                "ACCESS DENIED",
                "Insufficient Mana / Permissions. You lack the authority to recalibrate the Sanctum's nodes."
            )
            await ctx.send(embed=embed)
        else:
            bot_logger.error(f"Admin command error: {error}")

async def setup(bot):
    await bot.add_cog(Admin(bot))
