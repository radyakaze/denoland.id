import { NowRequest, NowResponse } from "@vercel/node";
import { parseNameVersion, findEntry } from "../../../../util/registry_utils";
import next from "next";

export default async (req: NowRequest, res: NowResponse) => {
  const url = req.query.url.toString();

  // Detect browser
  if (req.headers.accept?.indexOf("html") >= 0) {
    // Render Nextjs
    const app = next({ dev: process.env.NODE_ENV !== "production" });
    await app.prepare();
    const html = await app.renderToHTML(req, res, url);
    res.setHeader("Cache-Control", "s-maxage=600");
    return res.send(html);
  }

  const remoteUrl = getRegistrySourceURL(url);
  if (!remoteUrl) {
    return res.status(404).send(`Not in database.json: ${url}`);
  }

  const response = await fetch(remoteUrl);
  const originContentType = response.headers.get("content-type");

  if (
    response.ok &&
    (!originContentType || originContentType?.includes("text/plain"))
  ) {
    const charset = originContentType?.includes("charset=utf-8")
      ? "; charset=utf-8"
      : "";
    if (url.endsWith(".js")) {
      res.setHeader("content-type", `application/javascript${charset}`);
    } else if (url.endsWith(".ts")) {
      res.setHeader("content-type", `application/typescript${charset}`);
    } else {
      res.setHeader("content-type", `text/plain${charset}`);
    }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  // transform body into text
  const body = await response.text();

  res.setHeader("Cache-Control", "s-maxage=300");
  return res.send(body);
};

export function getRegistrySourceURL(pathname: string): string | undefined {
  const nameBranchRest = pathname.replace(/^\/|\/$/g, "");
  const [nameBranch, ...rest] = nameBranchRest.split("/");
  const [name, version] = parseNameVersion(nameBranch);
  const path = rest.join("/");
  const entry = findEntry(name);
  return entry?.getSourceURL("/" + path, version);
}
