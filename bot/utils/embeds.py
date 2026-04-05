import discord
from datetime import datetime, timezone
from bot.config import Theme

def create_dungeon_embed(title: str, description: str = None, color: int = Theme.PRIMARY, thumbnail: str = None, image: str = None):
    """
    Creates a premium, minimalist 'Midnight Sanctum' embed.
    """
    embed = discord.Embed(
        title=f"**{title}**",
        description=description,
        color=color
    )
    
    if thumbnail:
        embed.set_thumbnail(url=thumbnail)
    if image:
        embed.set_image(url=image)
        
    return embed

def create_error_embed(title: str, message: str):
    """
    Standardized error message embed.
    """
    return create_dungeon_embed(
        title=f"SYSTEM ALERT // {title}",
        description=Theme.error(message),
        color=Theme.ERROR
    )

def create_success_embed(title: str, message: str):
    """
    Standardized success message embed.
    """
    return create_dungeon_embed(
        title=title,
        description=message,
        color=Theme.SUCCESS
    )
