"""Short code generation utilities."""

import re

import shortuuid


def generate_short_code(length: int = 7) -> str:
    """
    Generate a URL-safe short code using shortuuid.
    
    Args:
        length: Length of the short code to generate (default: 7)
        
    Returns:
        A URL-safe alphanumeric short code
    """
    return shortuuid.ShortUUID().random(length=length)


def is_valid_custom_alias(alias: str) -> bool:
    """
    Validate a custom alias for URL shortening.
    
    Rules:
    - Must be 3-20 characters long
    - Can only contain alphanumeric characters, hyphens, and underscores
    - Cannot start or end with a hyphen or underscore
    
    Args:
        alias: The custom alias to validate
        
    Returns:
        True if the alias is valid, False otherwise
    """
    if not alias:
        return False
    
    # Check length (3-20 characters)
    if len(alias) < 3 or len(alias) > 20:
        return False
    
    # Check pattern: alphanumeric, hyphens, underscores only
    # Must start and end with alphanumeric
    pattern = r'^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$'
    
    # For 3+ char aliases, use the full pattern
    if len(alias) >= 2:
        pattern = r'^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$'
    else:
        # Single character alias (but we already checked min length is 3)
        pattern = r'^[a-zA-Z0-9]$'
    
    return bool(re.match(pattern, alias))
