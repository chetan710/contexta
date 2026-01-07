declare module "tesseract.js-node" {
    import { Readable } from "stream";
  
    export interface RecognizeOptions {
      lang?: string;
      tessedit_char_whitelist?: string;
      [key: string]: unknown;
    }
  
    export interface RecognizeResult {
      text: string;
      confidence?: number;
      [key: string]: unknown;
    }
  
    export function recognize(
      input: string | Buffer | Readable,
      lang?: string,
      options?: RecognizeOptions
    ): Promise<RecognizeResult>;
  }
  