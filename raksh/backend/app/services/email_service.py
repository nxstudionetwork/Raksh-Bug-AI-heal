from app.utils.logger import logger


def send_verification_email(email: str, token: str) -> bool:
    logger.info(f"[EMAIL] Verification to {email}: token={token}")
    return True


def send_password_reset_email(email: str, token: str) -> bool:
    logger.info(f"[EMAIL] Password reset to {email}: token={token}")
    return True


def send_welcome_email(email: str, name: str) -> bool:
    logger.info(f"[EMAIL] Welcome to {email}: name={name}")
    return True
