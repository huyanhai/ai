/**
 * 解析 Markdown 文件内容
 * @param data 文件 Buffer
 * @returns 解析后的字符串内容
 */
export async function parseMarkdown(data: Buffer): Promise<string> {
  try {
    // Markdown 本身就是纯文本，直接转为字符串即可
    const text = data.toString("utf-8");
    console.log("Markdown 解析成功");
    return text;
  } catch (error) {
    console.error("Markdown 解析失败:", error);
    return "";
  }
}

