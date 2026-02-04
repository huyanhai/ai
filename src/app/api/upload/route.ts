import { NextResponse } from "next/server";
import { imageKit } from "@/lib/images";
import { parsePDF } from "@/utils/pdfReader";
import { parseMarkdown } from "@/utils/markdownReader";
import { saveToVectorStore, checkFileExists } from "@/lib/vector-store";
import { getFileExtension } from "@/utils/file";
import { DocumentExts } from "@/constants/file";
import { UPLOAD_IMAGE_HOST } from "@/constants/env";

// 图片类型的文件上传到imageKit
async function uploadImage(hash: string, buffer: Buffer, fileName: string) {
  const existingFiles = await imageKit.listFiles({
    tags: hash,
    limit: 1,
  });

  if (existingFiles && existingFiles.length > 0) {
    console.log(`[ImageKit] 文件已存在 (hash: ${hash}), 跳过上传`);
    return `${UPLOAD_IMAGE_HOST}/${existingFiles[0]?.name}`;
  }

  const result = await imageKit.upload({
    file: buffer,
    fileName: fileName,
    tags: [hash],
  });

  return result.url;
}

// 其他类型的文件解析内容后存储到向量数据库
async function uploadFile(
  hash: string,
  buffer: Buffer,
  fileName: string,
  extension: string,
) {
  const existing = await checkFileExists(hash as string);
  if (existing) {
    return (existing.metadata as any)?.url || "";
  }

  let text = "";
  if (extension === "pdf") {
    text = await parsePDF(buffer);
  } else if (extension === "md" || extension === "markdown") {
    text = await parseMarkdown(buffer);
  }

  if (!text) {
    throw new Error("文件内容为空或解析失败");
  }

  // 文本分段
  const chunkSize = 1000;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - 200) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  // 文件元数据
  const metadata = chunks.map(() => ({
    hash: hash as string,
    fileName: fileName,
    uploadedAt: new Date().toISOString(),
    url: "", // PDF 暂无公网 URL
  }));

  await saveToVectorStore(chunks, metadata);
  return "";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const fileName = formData.get("fileName");
    const hash = formData.get("hash");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = getFileExtension(fileName as string);

    let url = "";

    try {
      if (DocumentExts.includes(extension)) {
        url = await uploadFile(
          hash as string,
          buffer,
          fileName as string,
          extension,
        );
      } else {
        url = await uploadImage(hash as string, buffer, fileName as string);
      }
    } catch (error) {
      console.error("文件上传失败:", error);
      return NextResponse.json(
        { error: "文件上传过程中出现错误" },
        { status: 500 },
      );
    }
    return NextResponse.json({
      data: {
        url,
        hash,
      },
    });
  } catch (error) {
    console.error("文件上传失败:", error);
    return NextResponse.json(
      { error: "文件上传过程中出现错误" },
      { status: 500 },
    );
  }
}
