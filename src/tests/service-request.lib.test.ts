import {
  formatServiceRequestComment,
  formatServiceRequestFields,
  formatServiceRequestSubject,
  JOINER_FIELD_SPECS,
  LEAVER_FIELD_SPECS,
  type ServiceRequest,
  validateServiceRequest,
} from "@/lib/service-request";

describe("field specs", () => {
  it("attaches a note to the involuntary departure choice and to no other", () => {
    const choicesWithNote = [...JOINER_FIELD_SPECS, ...LEAVER_FIELD_SPECS]
      .flatMap((spec) =>
        (spec.choices ?? []).map((choice) => ({ key: spec.key, ...choice })),
      )
      .filter((choice) => choice.note !== undefined);

    expect(choicesWithNote).toEqual([
      {
        key: "departureType",
        value: "involuntary",
        label: "Involuntary",
        note: "We handle an involuntary departure ahead of other requests. We phone you to confirm as soon as we see it, and access is cut once you confirm.",
      },
    ]);
  });
});

const joinerFields = {
  requesterName: "Dana Office",
  requesterEmail: "dana@client.example",
  requesterPhone: "+12895550123",
  newHireName: "Jane Doe",
  jobTitle: "Bookkeeper",
  startDate: "2026-12-01",
  matchAccessOf: "Sam Existing",
  apps: "QuickBooks, Microsoft 365",
  licenses: "Microsoft 365 Business Premium",
  hardware: "Laptop and two monitors",
  remoteAccess: "yes",
  distributionLists: "accounting@client.example",
  notes: "Starts in the Burlington office.",
};

const leaverFields = {
  requesterName: "Dana Office",
  requesterEmail: "dana@client.example",
  requesterPhone: "+12895550123",
  employeeName: "John Roe",
  departureType: "involuntary",
  lastWorkingDay: "2026-11-30",
  accessCutoff: "2026-11-30T17:00",
  mailboxRecipient: "Sam Existing",
  fileOwner: "Sam Existing",
  hardwareReturn: "yes",
  notes: "",
};

describe("validateServiceRequest", () => {
  it("accepts a complete joiner request", () => {
    const result = validateServiceRequest("joiner", joinerFields);

    expect(result).toEqual({
      ok: true,
      request: { mode: "joiner", fields: joinerFields },
    });
  });

  it("accepts a complete leaver request", () => {
    expect(validateServiceRequest("leaver", leaverFields)).toEqual({
      ok: true,
      request: { mode: "leaver", fields: leaverFields },
    });
  });

  it("accepts a joiner request with only the required fields", () => {
    const result = validateServiceRequest("joiner", {
      requesterName: "Dana Office",
      requesterEmail: "dana@client.example",
      requesterPhone: "+12895550123",
      newHireName: "Jane Doe",
      startDate: "2026-12-01",
      matchAccessOf: "Sam Existing",
    });

    expect(result).toEqual({
      ok: true,
      request: {
        mode: "joiner",
        fields: {
          requesterName: "Dana Office",
          requesterEmail: "dana@client.example",
          requesterPhone: "+12895550123",
          newHireName: "Jane Doe",
          jobTitle: "",
          startDate: "2026-12-01",
          matchAccessOf: "Sam Existing",
          apps: "",
          licenses: "",
          hardware: "",
          remoteAccess: "",
          distributionLists: "",
          notes: "",
        },
      },
    });
  });

  it("trims values and drops fields the mode does not have", () => {
    const result = validateServiceRequest("joiner", {
      ...joinerFields,
      newHireName: "  Jane Doe  ",
      employeeName: "John Roe",
    });

    expect(result).toEqual({
      ok: true,
      request: { mode: "joiner", fields: joinerFields },
    });
  });

  it("formats the requester's phone as E.164", () => {
    const result = validateServiceRequest("joiner", {
      ...joinerFields,
      requesterPhone: "(289) 555-0123",
    });

    expect(result).toMatchObject({
      ok: true,
      request: { fields: { requesterPhone: "+12895550123" } },
    });
  });

  it("names every missing required joiner field", () => {
    const result = validateServiceRequest("joiner", {});

    expect(result).toEqual({
      ok: false,
      error:
        "Please fill in: Your name, Your email, Your phone, New hire's name, Start date, Match the access of.",
      fieldErrors: {
        requesterName: "enter your name",
        requesterEmail: "enter your email",
        requesterPhone: "enter your phone",
        newHireName: "enter the new hire's name",
        startDate: "enter the start date",
        matchAccessOf: "enter whose access to match",
      },
    });
  });

  it("names every missing required leaver field", () => {
    const result = validateServiceRequest("leaver", {
      requesterName: "Dana Office",
      requesterEmail: "dana@client.example",
      requesterPhone: "+12895550123",
    });

    expect(result).toEqual({
      ok: false,
      error:
        "Please fill in: Departing employee's name, Departure type, Last working day, Cut access at.",
      fieldErrors: {
        employeeName: "enter the departing employee's name",
        departureType: "choose a departure type",
        lastWorkingDay: "enter the last working day",
        accessCutoff: "enter when to cut access",
      },
    });
  });

  it("treats a whitespace-only required field as missing", () => {
    const result = validateServiceRequest("joiner", {
      ...joinerFields,
      newHireName: "   ",
    });

    expect(result).toEqual({
      ok: false,
      error: "Please fill in: New hire's name.",
      fieldErrors: { newHireName: "enter the new hire's name" },
    });
  });

  it("treats a non-string value as missing", () => {
    const result = validateServiceRequest("joiner", {
      ...joinerFields,
      newHireName: { toString: () => "Jane Doe" },
    });

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { newHireName: "enter the new hire's name" },
    });
  });

  it.each([null, undefined, "fields", ["Jane Doe"]])(
    "reports every required field when the fields are %p",
    (fields) => {
      const result = validateServiceRequest("leaver", fields);

      expect(result.ok).toBe(false);
      expect(Object.keys(result.ok ? {} : result.fieldErrors)).toEqual([
        "requesterName",
        "requesterEmail",
        "requesterPhone",
        "employeeName",
        "departureType",
        "lastWorkingDay",
        "accessCutoff",
      ]);
    },
  );

  it.each(["", "mover", undefined, null, 7])(
    "rejects the unknown mode %p",
    (mode) => {
      expect(validateServiceRequest(mode, joinerFields)).toEqual({
        ok: false,
        error: "Choose a joiner or a leaver request.",
        fieldErrors: {},
      });
    },
  );

  it.each([
    [
      "requesterEmail",
      "dana@client",
      "enter the full address, like dana@company.ca",
    ],
    ["requesterPhone", "12", "enter a full phone number with its area code"],
    ["startDate", "next Monday", "enter the date as YYYY-MM-DD"],
    ["startDate", "2026-13-01", "enter the date as YYYY-MM-DD"],
    ["startDate", "2026-02-30", "enter the date as YYYY-MM-DD"],
    ["startDate", "2026-04-31", "enter the date as YYYY-MM-DD"],
    ["startDate", "2026-02-00", "enter the date as YYYY-MM-DD"],
    ["startDate", "2026-00-10", "enter the date as YYYY-MM-DD"],
    ["startDate", "x2026-12-01", "enter the date as YYYY-MM-DD"],
    ["startDate", "2026-12-01x", "enter the date as YYYY-MM-DD"],
    ["remoteAccess", "maybe", "choose one of the options"],
  ])("rejects the joiner %s %p", (key, value, message) => {
    const result = validateServiceRequest("joiner", {
      ...joinerFields,
      [key]: value,
    });

    expect(result).toEqual({
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors: { [key]: message },
    });
  });

  it.each([
    ["accessCutoff", "2026-11-30", "enter the date and time"],
    ["accessCutoff", "2026-11-30T25:00", "enter the date and time"],
    ["accessCutoff", "2026-11-30T24:00", "enter the date and time"],
    ["accessCutoff", "2026-11-30Tx17:00", "enter the date and time"],
    ["accessCutoff", "2026-11-30T17:00T", "enter the date and time"],
    ["accessCutoff", "2026-11-30T17:60", "enter the date and time"],
    ["accessCutoff", "2026-02-30T17:00", "enter the date and time"],
    ["accessCutoff", "x2026-11-30T17:00", "enter the date and time"],
    ["accessCutoff", "2026-11-30T17:00x", "enter the date and time"],
    ["departureType", "fired", "choose one of the options"],
    ["hardwareReturn", "some", "choose one of the options"],
  ])("rejects the leaver %s %p", (key, value, message) => {
    const result = validateServiceRequest("leaver", {
      ...leaverFields,
      [key]: value,
    });

    expect(result).toEqual({
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors: { [key]: message },
    });
  });

  it.each([
    "2026-11-30T17:00:30",
    "2026-11-30T23:59",
    "2026-11-30T00:00",
    "2028-02-29T09:30",
  ])("accepts the access cutoff %p", (accessCutoff) => {
    const result = validateServiceRequest("leaver", {
      ...leaverFields,
      accessCutoff,
    });

    expect(result.ok).toBe(true);
  });

  it("accepts an amicable departure", () => {
    const result = validateServiceRequest("leaver", {
      ...leaverFields,
      departureType: "amicable",
    });

    expect(result).toMatchObject({
      ok: true,
      request: { fields: { departureType: "amicable" } },
    });
  });

  it("leads with the missing fields when some are missing and some are invalid", () => {
    const result = validateServiceRequest("joiner", {
      ...joinerFields,
      newHireName: "",
      requesterEmail: "dana@client",
    });

    expect(result).toEqual({
      ok: false,
      error: "Please fill in: New hire's name.",
      fieldErrors: {
        newHireName: "enter the new hire's name",
        requesterEmail: "enter the full address, like dana@company.ca",
      },
    });
  });

  it("accepts values at the length limits and rejects longer ones", () => {
    const atLimit = validateServiceRequest("joiner", {
      ...joinerFields,
      newHireName: "n".repeat(200),
      notes: "n".repeat(2000),
    });
    const overLimit = validateServiceRequest("joiner", {
      ...joinerFields,
      newHireName: "n".repeat(201),
      notes: "n".repeat(2001),
    });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors: {
        newHireName: "keep this under 200 characters",
        notes: "keep this under 2000 characters",
      },
    });
  });
});

function validRequest(mode: string, fields: unknown): ServiceRequest {
  const result = validateServiceRequest(mode, fields);
  if (!result.ok) throw new Error(result.error);
  return result.request;
}

describe("formatServiceRequestSubject", () => {
  it("names a joiner's new hire and start date", () => {
    const subject = formatServiceRequestSubject(
      validRequest("joiner", joinerFields),
    );

    expect(subject).toBe("Joiner: Jane Doe, starts 2026-12-01");
  });

  it("names a leaver's employee and last working day", () => {
    const subject = formatServiceRequestSubject(
      validRequest("leaver", leaverFields),
    );

    expect(subject).toBe("Leaver: John Roe, last day 2026-11-30");
  });
});

describe("formatServiceRequestFields", () => {
  it("labels every joiner field in form order", () => {
    const fields = formatServiceRequestFields(
      validRequest("joiner", joinerFields),
    );

    expect(Object.entries(fields)).toEqual([
      ["Request", "Joiner"],
      ["Your name", "Dana Office"],
      ["Your email", "dana@client.example"],
      ["Your phone", "+12895550123"],
      ["New hire's name", "Jane Doe"],
      ["Job title", "Bookkeeper"],
      ["Start date", "2026-12-01"],
      ["Match the access of", "Sam Existing"],
      ["Apps", "QuickBooks, Microsoft 365"],
      ["Licenses", "Microsoft 365 Business Premium"],
      ["Hardware", "Laptop and two monitors"],
      ["Remote access", "Yes"],
      ["Distribution lists", "accounting@client.example"],
      ["Notes", "Starts in the Burlington office."],
    ]);
  });

  it("leaves a capital T in ordinary text alone", () => {
    const fields = formatServiceRequestFields(
      validRequest("joiner", { ...joinerFields, jobTitle: "CTO" }),
    );

    expect(fields["Job title"]).toBe("CTO");
  });

  it("labels an amicable departure and an unreturned laptop", () => {
    const fields = formatServiceRequestFields(
      validRequest("leaver", {
        ...leaverFields,
        departureType: "amicable",
        hardwareReturn: "no",
      }),
    );

    expect(fields).toMatchObject({
      "Departure type": "Amicable",
      "Hardware coming back": "No",
    });
  });

  it("labels every leaver field, blank ones as empty strings", () => {
    const fields = formatServiceRequestFields(
      validRequest("leaver", { ...leaverFields, hardwareReturn: "" }),
    );

    expect(Object.entries(fields)).toEqual([
      ["Request", "Leaver"],
      ["Your name", "Dana Office"],
      ["Your email", "dana@client.example"],
      ["Your phone", "+12895550123"],
      ["Departing employee's name", "John Roe"],
      ["Departure type", "Involuntary"],
      ["Last working day", "2026-11-30"],
      ["Cut access at", "2026-11-30 17:00"],
      ["Mailbox goes to", "Sam Existing"],
      ["Files go to", "Sam Existing"],
      ["Hardware coming back", ""],
      ["Notes", ""],
    ]);
  });
});

describe("formatServiceRequestComment", () => {
  it("lists every leaver field under its section, marking blanks", () => {
    const comment = formatServiceRequestComment(
      validRequest("leaver", { ...leaverFields, hardwareReturn: "no" }),
    );

    expect(comment).toBe(
      [
        "Leaver request",
        "",
        "Your details",
        "Your name: Dana Office",
        "Your email: dana@client.example",
        "Your phone: +12895550123",
        "",
        "Departing employee",
        "Departing employee's name: John Roe",
        "Departure type: Involuntary",
        "",
        "Timing",
        "Last working day: 2026-11-30",
        "Cut access at: 2026-11-30 17:00",
        "",
        "Handover",
        "Mailbox goes to: Sam Existing",
        "Files go to: Sam Existing",
        "Hardware coming back: No",
        "",
        "Anything else",
        "Notes: (not provided)",
      ].join("\n"),
    );
  });

  it("lists every joiner field under its section", () => {
    const comment = formatServiceRequestComment(
      validRequest("joiner", { ...joinerFields, jobTitle: "" }),
    );

    expect(comment).toBe(
      [
        "Joiner request",
        "",
        "Your details",
        "Your name: Dana Office",
        "Your email: dana@client.example",
        "Your phone: +12895550123",
        "",
        "New hire",
        "New hire's name: Jane Doe",
        "Job title: (not provided)",
        "Start date: 2026-12-01",
        "",
        "Access and equipment",
        "Match the access of: Sam Existing",
        "Apps: QuickBooks, Microsoft 365",
        "Licenses: Microsoft 365 Business Premium",
        "Hardware: Laptop and two monitors",
        "Remote access: Yes",
        "Distribution lists: accounting@client.example",
        "",
        "Anything else",
        "Notes: Starts in the Burlington office.",
      ].join("\n"),
    );
  });
});
