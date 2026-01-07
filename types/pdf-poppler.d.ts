declare module "pdf-poppler" {
  export interface ConvertOptions {
    format: 'png' | 'jpeg';
    out_dir: string;
    out_prefix: string;
    page: number | null;
  }

  export function convert(file: string, options: ConvertOptions): Promise<void>;
  export function info(file: string): Promise<unknown>;
}
  