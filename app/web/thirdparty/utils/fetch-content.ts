export const fetchContent = (path: string, body?: any) => {
  const isGithubPages = location.hostname.includes("github.io");

  if (isGithubPages) {
    const repo = location.pathname.split("/")[1]; // repo name
    return fetch(`/${repo}/${path.replace(/^\/+/, "")}`);
  }

  return fetch(path, body);
};