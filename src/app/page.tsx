import { api, HydrateClient } from "@/trpc/server";
import { LatestPost } from "./_components/post";

export default function Home() {
  // 不用等待这里执行完成，直接执行下面的流程
  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <LatestPost />
    </HydrateClient>
  );
}
