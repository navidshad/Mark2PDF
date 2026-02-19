
export type PageSize = 'a4' | 'letter' | 'legal';
export type Orientation = 'portrait' | 'landscape';

export interface PDFOptions {
  pageSize: PageSize;
  orientation: Orientation;
  margin: number;
  filename: string;
}

export interface MarkdownContent {
  raw: string;
  html: string;
}
