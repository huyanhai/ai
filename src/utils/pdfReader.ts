import { PDFParse } from "pdf-parse";
import { CanvasFactory } from "pdf-parse/worker";

// 解析pdf
export async function parsePDF(data: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data, CanvasFactory });
    const result = await parser.getText();
    console.log("PDF 解析成功，总页数:", result.total);
    return result.text;
  } catch (error) {
    console.error("PDF 解析失败:", error);
    return "";
  }
}


