const basepath = "https://raw.githubusercontent.com/denoland/deno/";
const docpath = "https://github.com/denoland/deno/blob/";

export interface TableOfContents {
  [slug: string]: {
    name: string;
    children?: {
      [slug: string]: string;
    };
  };
}

export async function getTableOfContents(
  version: string
): Promise<TableOfContents> {
  const res = await fetch(`${basepath}${version}/docs/toc.json`);
  if (res.status !== 200) {
    throw Error(
      `Got an error (${
        res.status
      }) while getting the manual table of contents:\n${await res.text()}`
    );
  }
  return await res.json();
}

export function getFileURL(version: string, path: string) {
  return `${basepath}${version}/docs${path}.md`;
}

export function getDocURL(version: string, path: string) {
  return `${docpath}${version}/docs${path}.md`;
}
