import { readFileSync } from "fs";
import { join } from "path";

/**
 * The unique tag is only real once the workflow pushes it and deploys that
 * same name. A commit-SHA tag left in metadata-action would still be
 * overwritten on the next rebuild of that commit.
 */
const repoRoot = join(__dirname, "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("deploy workflow image identity", () => {
  const deployWorkflow = readRepoFile(".github/workflows/deploy.yml");

  it("pushes and deploys the tag from build-image-tag", () => {
    expect(deployWorkflow).toContain("scripts/build-image-tag.cjs");
    expect(deployWorkflow).toContain('--run-id "${{ github.run_id }}"');
    expect(deployWorkflow).toContain(
      '--run-attempt "${{ github.run_attempt }}"',
    );
    expect(deployWorkflow).toContain(
      "image_tag: ${{ steps.image_identity.outputs.image_tag }}",
    );
    expect(deployWorkflow).toContain(
      "type=raw,value=${{ steps.image_identity.outputs.image_tag }}",
    );
    expect(deployWorkflow).not.toContain("type=sha");
    expect(deployWorkflow).not.toContain(
      "image_tag: ${{ github.ref_name }}-${{ github.sha }}",
    );
  });

  it("records the digest beside the deployed tag so the running build is one artifact", () => {
    expect(deployWorkflow).toContain(
      "**Image digest:** \\`${{ needs.quality-and-build.outputs.image_digest }}\\`",
    );
  });
});

describe("rollback is an Ansible extra var", () => {
  it("passes DEPLOY_DOCKER_IMAGE with -e so the playbook can read it", () => {
    const taggingStrategy = readRepoFile("docs/cicd/image-tagging-strategy.md");

    expect(taggingStrategy).toContain(
      "-e DEPLOY_DOCKER_IMAGE=ghcr.io/bxmty/dotca:staging-",
    );
    expect(taggingStrategy).not.toMatch(/^DEPLOY_DOCKER_IMAGE=/m);
  });
});

describe("deploy playbooks", () => {
  it.each(["ansible/staging-deploy.yml", "ansible/production-deploy.yml"])(
    "%s pulls the image CI named, on purpose, before compose starts it",
    (playbookPath) => {
      const playbook = readRepoFile(playbookPath);
      expect(playbook).toContain('docker pull "{{ docker_image }}"');
      expect(playbook).toContain("pull_policy: missing");
      expect(playbook).toContain("does not substitute the moving");
      expect(playbook).not.toContain("Use alternative");
    },
  );
});
