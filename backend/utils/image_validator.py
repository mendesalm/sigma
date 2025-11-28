"""
Validador de imagens para upload de fotos de perfil e outros arquivos.

Este módulo fornece validação completa de arquivos de imagem including:
- Tipo MIME
- Tamanho do arquivo
- Dimensões mínimas e máximas
- Formato de imagem válido
"""

from fastapi import UploadFile, HTTPException, status
from PIL import Image
import io
from typing import Tuple, Optional


# Configurações de validação
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = {
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
}
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MIN_DIMENSIONS = (100, 100)  # largura x altura mínima
MAX_DIMENSIONS = (4000, 4000)  # largura x altura máxima


async def validate_image(
    file: UploadFile,
    max_size: int = MAX_FILE_SIZE,
    allowed_types: set = ALLOWED_TYPES,
    min_dims: Tuple[int, int] = MIN_DIMENSIONS,
    max_dims: Tuple[int, int] = MAX_DIMENSIONS
) -> bytes:
    """
    Valida arquivo de imagem completo.
    
    Validações realizadas:
    1. Tipo MIME permitido
    2. Extensão de arquivo permitida
    3. Tamanho máximo do arquivo
    4. Formato de imagem válido (abre com PIL)
    5. Dimensões mínimas e máximas
    
    Args:
        file: Arquivo enviado via FastAPI
        max_size: Tamanho máximo em bytes (default: 5MB)
        allowed_types: Set de tipos MIME permitidos
        min_dims: Tupla (largura, altura) mínima
        max_dims: Tupla (largura, altura) máxima
        
    Returns:
        bytes: Conteúdo do arquivo validado
        
    Raises:
        HTTPException 400: Se qualquer validação falhar
    """
    # 1. Validar tipo MIME
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Use: JPEG, PNG, GIF ou WebP"
        )
    
    # 2. Validar extensão do arquivo
    if file.filename:
        extension = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Extensão de arquivo não permitida. Use: {', '.join(ALLOWED_EXTENSIONS)}"
            )
    
    # 3. Ler e validar tamanho do arquivo
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        current_mb = file_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo muito grande ({current_mb:.2f}MB). Tamanho máximo: {max_mb:.0f}MB"
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo está vazio"
        )
    
    # 4. Validar se é realmente uma imagem e suas dimensões
    try:
        image = Image.open(io.BytesIO(contents))
        width, height = image.size
        
        # Validar dimensões mínimas
        if width < min_dims[0] or height < min_dims[1]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Imagem muito pequena ({width}x{height}px). Mínimo: {min_dims[0]}x{min_dims[1]}px"
            )
        
        # Validar dimensões máximas
        if width > max_dims[0] or height > max_dims[1]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Imagem muito grande ({width}x{height}px). Máximo: {max_dims[0]}x{max_dims[1]}px"
            )
        
        # Verificar se a imagem pode ser processada
        image.verify()
        
    except HTTPException:
        # Re-raise HTTPExceptions que criamos
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo não é uma imagem válida ou está corrompido: {str(e)}"
        )
    
    return contents


async def validate_image_light(file: UploadFile) -> bytes:
    """
    Validação leve de imagem (apenas tipo e tamanho).
    
    Útil quando você quer validação rápida sem verificar dimensões.
    
    Args:
        file: Arquivo enviado
        
    Returns:
        bytes: Conteúdo do arquivo
        
    Raises:
        HTTPException 400: Se validação falhar
    """
    # Validar tipo MIME
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de arquivo não permitido. Use: JPEG, PNG, GIF ou WebP"
        )
    
    # Ler e validar tamanho
    contents = await file.read()
    
    if len(contents) > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo muito grande. Máximo permitido: {max_mb:.0f}MB"
        )
    
    return contents


def get_image_info(contents: bytes) -> dict:
    """
    Obtém informações da imagem.
    
    Args:
        contents: Bytes da imagem
        
    Returns:
        dict: Informações da imagem (format, size, mode)
    """
    try:
        image = Image.open(io.BytesIO(contents))
        return {
            'format': image.format,
            'size': image.size,
            'width': image.size[0],
            'height': image.size[1],
            'mode': image.mode,
        }
    except Exception:
        return {}


async def resize_image_if_needed(
    contents: bytes,
    max_width: int = 800,
    max_height: int = 800,
    quality: int = 85
) -> Optional[bytes]:
    """
    Redimensiona imagem se exceder dimensões máximas.
    
    Mantém aspect ratio e usa alta qualidade.
    
    Args:
        contents: Bytes da imagem original
        max_width: Largura máxima
        max_height: Altura máxima
        quality: Qualidade JPEG (1-100)
        
    Returns:
        bytes: Imagem redimensionada ou None se não precisar redimensionar
    """
    try:
        image = Image.open(io.BytesIO(contents))
        width, height = image.size
        
        # Verificar se precisa redimensionar
        if width <= max_width and height <= max_height:
            return None  # Não precisa redimensionar
        
        # Calcular novo tamanho mantendo aspect ratio
        ratio = min(max_width / width, max_height / height)
        new_size = (int(width * ratio), int(height * ratio))
        
        # Redimensionar com alta qualidade
        resized = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Converter para bytes
        output = io.BytesIO()
        if image.format == 'JPEG' or image.format == 'JPG':
            resized.save(output, format='JPEG', quality=quality, optimize=True)
        elif image.format == 'PNG':
            resized.save(output, format='PNG', optimize=True)
        else:
            resized.save(output, format=image.format)
        
        return output.getvalue()
        
    except Exception:
        return None
