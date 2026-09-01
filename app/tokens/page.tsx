import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import TokenTool from "./TokenTool";

export const metadata: Metadata = withSocial({
  title: "Token Tool",
  description:
    "Paste a long passage and optimize your tokens to the max amount of tokens possible.",
  path: "/tokens",
});

export default function TokensPage() {
  return <TokenTool />;
}
