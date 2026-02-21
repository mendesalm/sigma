def send_email(to: str, subject: str, body: str):
    """
    Sends an email.
    This is a placeholder and does not actually send an email.
    In a real implementation, you would use a library like `fastapi-mail` or `smtplib`.
    """
    print("--- SENDING EMAIL (Placeholder) ---")
    print(f"To: {to}")
    print(f"Subject: {subject}")
    print(f"Body: {body}")
    print("------------------------------------")


def send_password_reset_email(to: str, new_password: str):
    """
    Sends a password reset email.
    """
    subject = "Sua senha foi redefinida"
    body = f"Sua nova senha é: {new_password}"
    send_email(to=to, subject=subject, body=body)


def send_library_late_notice_email(to: str, book_title: str):
    subject = "Aviso de Atraso - Biblioteca"
    body = f"O prazo de devolução do livro '{book_title}' expirou. Por favor, regularize sua situação com a Secretaria/Biblioteca da Loja."
    send_email(to=to, subject=subject, body=body)


def send_library_waitlist_notice_email(to: str, book_title: str):
    subject = "Livro Disponível - Fila de Espera"
    body = f"O livro '{book_title}' que você reservou já está disponível na Loja! Você tem 15 dias para retirá-lo."
    send_email(to=to, subject=subject, body=body)
