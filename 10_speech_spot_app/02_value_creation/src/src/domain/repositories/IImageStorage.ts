export interface IImageStorage {
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<string>;
}
