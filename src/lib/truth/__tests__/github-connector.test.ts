import { describe, it, expect } from "vitest";
import { parseGitHubRepoUrl } from "../connectors/github";

describe("parseGitHubRepoUrl", () => {
  it("parses standard github urls", () => {
    expect(parseGitHubRepoUrl("https://github.com/thejustinfagan/fleet-intel")).toEqual({
      owner: "thejustinfagan",
      repo: "fleet-intel",
    });
  });

  it("parses urls with .git suffix", () => {
    expect(parseGitHubRepoUrl("https://github.com/thejustinfagan/mission-control.git")).toEqual({
      owner: "thejustinfagan",
      repo: "mission-control",
    });
  });

  it("returns null for non-github urls", () => {
    expect(parseGitHubRepoUrl("https://gitlab.com/foo/bar")).toBeNull();
  });
});
