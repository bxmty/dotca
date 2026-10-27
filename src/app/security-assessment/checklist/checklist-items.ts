export type SecurityChecklistItem = {
  title: string;
  detail: string;
};

export const securityChecklistItems: readonly SecurityChecklistItem[] = [
  {
    title: "Turn on multi-factor authentication (MFA) everywhere",
    detail:
      "Start with email, banking, and anything that can spend money or reset other passwords. An authenticator app beats SMS codes.",
  },
  {
    title: "Adopt a password manager",
    detail:
      "One strong master password; unique generated passwords for everything else. Stop the reuse chain that turns one leak into five.",
  },
  {
    title: "Set up automatic, tested backups",
    detail:
      "Automate backups of everything you can't afford to lose, keep at least one copy offsite or offline, and actually restore a file once a quarter to prove it works.",
  },
  {
    title: "Let updates install themselves",
    detail:
      "Enable automatic updates on operating systems, browsers, and key apps. Postponed updates are open doors that were already fixed.",
  },
  {
    title: "Encrypt and lock every work device",
    detail:
      "Full-disk encryption (BitLocker/FileVault), a strong lock screen, and remote-wipe capability on laptops and phones that touch work data.",
  },
  {
    title: "Verify payment changes by phone",
    detail:
      "Any request to change banking details — from a supplier, client, or executive — gets confirmed by phone using a number you already had. No exceptions.",
  },
  {
    title: "Kill shared logins",
    detail:
      "Give every person their own account with only the access their role needs. Shared credentials make incidents impossible to trace and revoke.",
  },
  {
    title: "Write the one-page security policy",
    detail:
      "Passwords, devices, data handling, and who to call when something looks wrong. One page beats zero pages — and new hires need it most.",
  },
  {
    title: "Offboard with a checklist",
    detail:
      "When someone leaves: accounts disabled same day, devices returned, shared passwords rotated. Keep the list written so nothing lingers.",
  },
  {
    title: "Talk about phishing openly",
    detail:
      "Show your team (or yourself) real examples. Agree on one habit: unexpected requests for money, credentials, or urgency get verified through a second channel.",
  },
];
