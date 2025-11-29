/**
 * Utilitários para validação de imagens no frontend.
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const MIN_DIMENSIONS = { width: 100, height: 100 };
export const MAX_DIMENSIONS = { width: 4000, height: 4000 };

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida um arquivo de imagem (tamanho e tipo).
 * @param file Arquivo a ser validado
 * @returns Resultado da validação
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `O arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    };
  }

  return { isValid: true };
};

/**
 * Valida as dimensões de uma imagem.
 * Precisa carregar a imagem para verificar.
 * @param file Arquivo a ser validado
 * @returns Promise com o resultado da validação
 */
export const validateImageDimensions = (file: File): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = img;

      if (width < MIN_DIMENSIONS.width || height < MIN_DIMENSIONS.height) {
        resolve({
          isValid: false,
          error: `A imagem é muito pequena. Mínimo: ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}px.`
        });
        return;
      }

      if (width > MAX_DIMENSIONS.width || height > MAX_DIMENSIONS.height) {
        resolve({
          isValid: false,
          error: `A imagem é muito grande. Máximo: ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}px.`
        });
        return;
      }

      resolve({ isValid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        error: 'Erro ao carregar a imagem. O arquivo pode estar corrompido.'
      });
    };

    img.src = objectUrl;
  });
};
