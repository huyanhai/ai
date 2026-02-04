import { googleGenAIEmbeddings } from "./llm";
import { supabase } from "./supabase";

class SupabaseVectorStore {
  async generateEmbedding(contents: string | string[]) {
    try {
      const isBatch = Array.isArray(contents);
      const response = await googleGenAIEmbeddings.models.embedContent({
        model: "gemini-embedding-001",
        contents: isBatch ? contents : [contents], // 统一转为数组处理
        config: {
          outputDimensionality: 768,
        },
      });

      return response.embeddings; // 始终从 plural embeddings 获取
    } catch (error) {
      console.error("Embedding生成错误:", error);
      throw error;
    }
  }

  async addDocuments(documents: { pageContent: string; metadata: any }[]) {
    // 1. 生成向量 (批量处理)
    const texts = documents.map((doc) => doc.pageContent);
    const embeddings = await this.generateEmbedding(texts);

    const docsWithEmbeddings = documents.map((doc, i) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      embedding: embeddings?.[i]?.values,
    }));

    // 2. 使用 Supabase 客户端插入数据
    const { error } = await supabase
      .from("documents")
      .insert(docsWithEmbeddings);

    if (error) {
      console.error("Error adding documents to Supabase:", error);
      throw error;
    }

    console.log(
      `[Supabase] 已成功将 ${documents.length} 条文档同步至 Supabase`,
    );
  }

  /**
   * 执行向量相似度搜索
   * 注意：这需要在 Supabase 中定义 RPC 函数 'match_documents'
   */
  async query(
    queryText: string,
    topK: number = 3,
    filter?: Record<string, any>,
    threshold: number = 0.1,
  ) {
    // 1. 生成查询文本的向量
    const embeddings = await this.generateEmbedding(queryText);
    const embedding = embeddings?.[0]?.values;

    if (!embedding) {
      throw new Error("未能生成查询向量");
    }

    console.log("[Supabase] Calling match_documents with:", {
      match_threshold: threshold,
      match_count: topK,
      filter: filter || {},
    });

    // 2. 调用 Supabase RPC 进行相似度检索
    // 传入通用的 filter 对象
    const { data: results, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: topK,
      filter: filter || {},
    });

    if (error) {
      console.error("Error querying Supabase vector store:", error);
      throw error;
    }

    console.log("[Supabase] Raw results from RPC:", results?.length || 0);

    // 3. 格式化返回结果
    const formattedResults = (results || []).map((result: any) => ({
      id: result.id,
      score: result.similarity,
      text: result.content,
      metadata: result.metadata || {},
    }));

    console.log(
      `[Supabase] Query returned ${formattedResults.length} matches above threshold ${threshold}`,
    );
    return formattedResults;
  }
}

let store: SupabaseVectorStore | null = null;

export const getVectorStore = async () => {
  if (!store) {
    store = new SupabaseVectorStore();
  }
  return store;
};

export const saveToVectorStore = async (
  texts: string[],
  metadata: Record<string, any>[],
) => {
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(
    texts.map((text, i) => ({
      pageContent: text,
      metadata: metadata[i] || {},
    })),
  );
};

export const queryVectorStore = async (
  queryText: string,
  topK: number = 3,
  filter?: Record<string, any>,
  threshold: number = 0.5,
) => {
  const vectorStore = await getVectorStore();
  return vectorStore.query(queryText, topK, filter, threshold);
};

export const checkFileExists = async (hash: string) => {
  if (!hash) return null;
  const { data, error } = await supabase
    .from("documents")
    .select("id, metadata")
    .contains("metadata", { hash })
    .limit(1);

  if (error) {
    console.error("查询文件是否存在时出错:", error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};
