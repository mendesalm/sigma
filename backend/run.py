import sys
import asyncio
import uvicorn
import os

if __name__ == "__main__":
    # Configura a política de loop de eventos para Windows antes de qualquer outra coisa
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    # Adiciona o diretório atual ao path para garantir que as importações funcionem
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))

    # Roda o servidor Uvicorn
    # Nota: reload=True pode redefinir o loop em alguns casos, mas rodando via script python
    # geralmente respeita a política definida acima.
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, app_dir=os.path.dirname(os.path.abspath(__file__)))
