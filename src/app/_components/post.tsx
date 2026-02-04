"use client";

import { useState } from "react";

import { api } from "@/trpc/react";

export function LatestPost() {
  // 这个地方是利用了es6的proxy方法，当访问useSuspenseQuery属性的时候，会进行拦截，底层会去调用@tanstack/react-query的useSuspenseQuery方法
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  // 它是 tRPC 的一个助手钩子，让你可以访问底层 React Query 的各种工具函数（如 invalidate、setQueryData 等）
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      // 将post缓存的数据变为过期的数据，并重新获取新的数据
      await utils.post.invalidate();
      setName("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Your most recent post: {latestPost.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ name });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
