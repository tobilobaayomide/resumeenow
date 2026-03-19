const toError = (error: DOMException | null, fallbackMessage: string): Error => {
  if (error?.message) {
    return new Error(error.message);
  }

  return new Error(fallbackMessage);
};

export const readFileAsArrayBuffer = async (file: Blob): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(toError(reader.error, 'Failed to read file as binary data.'));
    };

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error('File reader returned an unexpected binary result.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const readFileAsText = async (file: Blob): Promise<string> => {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(toError(reader.error, 'Failed to read file as text.'));
    };

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('File reader returned an unexpected text result.'));
    };

    reader.readAsText(file);
  });
};
