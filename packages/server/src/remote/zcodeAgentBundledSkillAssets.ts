import { posix } from "node:path";
export const REMOTE_AGENT_BUNDLED_SKILL_DIR_NAME = "packages";
export const REMOTE_AGENT_BUNDLED_SKILL_PACKAGE_NAMES = ["bundled-skills"] as const;
export const REMOTE_AGENT_BUNDLED_SKILL_INCLUDED_TOP_LEVEL_PATHS = ["skills", "office-migration.json", "office-requirements.txt"] as const;
export const REMOTE_AGENT_BUNDLED_SKILL_REQUIRED_RELATIVE_PATHS = ["bundled-skills/office-migration.json", ...["dynamic-workflows", "docx", "xlsx", "pptx", "pdf"].map(name => "bundled-skills/skills/" + name + "/SKILL.md")];
export function buildRemoteAgentBundledSkillDir(remoteProviderDir: string): string { return posix.join(remoteProviderDir, REMOTE_AGENT_BUNDLED_SKILL_DIR_NAME); }
export function buildRemoteAgentBundledSkillSourceRelativePath(params: {runtimeResourceDir: string; platformArch: string}): string { return posix.join(params.runtimeResourceDir, params.platformArch, REMOTE_AGENT_BUNDLED_SKILL_DIR_NAME); }
export function buildRemoteAgentBundledSkillRequiredPaths(remoteProviderDir: string): string[] { return REMOTE_AGENT_BUNDLED_SKILL_REQUIRED_RELATIVE_PATHS.map(path => posix.join(buildRemoteAgentBundledSkillDir(remoteProviderDir), path)); }
