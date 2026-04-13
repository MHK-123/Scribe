import discord
from discord import app_commands
from discord.ext import commands
from bot.core.database import get_pool
from bot.utils.embeds import create_error_embed
from bot.utils.logger import bot_logger

class PomodoroCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    pomodoro_group = app_commands.Group(name="pomodoro", description="Manifest and manage focus rituals")
    
    @pomodoro_group.command(name="start", description="Ignite a custom focus ritual in your current voice sanctuary")
    @app_commands.describe(focus_time="Focus duration in minutes", break_time="Break duration in minutes")
    async def pomo_start(self, interaction: discord.Interaction, focus_time: int = 25, break_time: int = 5):
        """Manifest a focus ritual in any voice channel."""
        # 1. Voice Sanctuary Check
        if not interaction.user.voice or not interaction.user.voice.channel:
            return await interaction.response.send_message(
                embed=create_error_embed("SANCTUARY ABSENT", "You must be inside a voice sanctuary before initiating the Scribe focus engine."),
                ephemeral=True
            )

        # 2. Subsystem Readiness
        if not hasattr(self.bot, 'pomodoro_manager'):
            return await interaction.response.send_message("Pomodoro subsystem is currently rebooting.", ephemeral=True)

        vc = interaction.user.voice.channel
        
        # 3. Ritual Manifestation (Config Override)
        # We use the current interaction channel as the HUD node
        custom_cfg = {
            'text_channel_id': interaction.channel.id,
            'focus_duration': focus_time,
            'break_duration': break_time,
            'cycles': 0,        # Infinite cycles
            'auto_stop': True
        }

        await interaction.response.send_message(
            f"**Ritual Ignited:** Focusing for `{focus_time}m` in {vc.mention}. HUD manifested in this channel.",
            ephemeral=True
        )
        
        await self.bot.pomodoro_manager.start_session(interaction.guild, vc, custom_cfg)

async def setup(bot):
    await bot.add_cog(PomodoroCommands(bot))
